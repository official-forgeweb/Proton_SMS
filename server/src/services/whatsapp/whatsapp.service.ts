import prisma from '../../config/database';
import { formatPhoneNumber } from '../../utils/whatsapp/formatPhone';
import { decrypt } from '../../utils/whatsapp/encrypt';
import { retryWithBackoff } from '../../utils/whatsapp/retryLogic';
import { mapMetaError } from '../../utils/whatsapp/errorMapper';
import { randomUUID } from 'crypto';

export interface MessageMeta {
  recipientName?: string;
  recipientType?: 'STUDENT' | 'TEACHER' | 'COORDINATOR' | 'PARENT' | 'CUSTOM';
  recipientUserId?: string;
  triggeredBy?: 'SYSTEM' | 'MANUAL' | 'AUTOMATION' | 'WEBHOOK';
  automationType?: string;
}

/**
 * Retrieves the global WhatsApp configuration, falling back to environment variables.
 */
export async function getWhatsAppConfig() {
  let config = await prisma.whatsAppConfig.findUnique({
    where: { id: 'global' },
  });

  if (!config) {
    config = await prisma.whatsAppConfig.create({
      data: {
        id: 'global',
        is_active: false,
        is_mock_mode: true,
        daily_limit: 250,
      },
    });
  }

  // Determine active keys, prioritizing DB values, then env variables
  const dbAccessTokenDecrypted = config.access_token ? decrypt(config.access_token) : '';
  const accessToken = dbAccessTokenDecrypted || process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = config.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const businessAccountId = config.business_account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const verifyToken = config.verify_token || process.env.WHATSAPP_VERIFY_TOKEN || '';
  const apiVersion = config.api_version || process.env.WHATSAPP_API_VERSION || 'v18.0';
  const apiBaseUrl = config.api_base_url || process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com';

  const hasCredentials = !!(accessToken && phoneNumberId && businessAccountId);
  
  // System is in LIVE mode if configuration is active AND mock mode is disabled AND we have credentials
  const isLive = config.is_active && !config.is_mock_mode && hasCredentials;

  return {
    ...config,
    accessToken,
    phoneNumberId,
    businessAccountId,
    verifyToken,
    apiVersion,
    apiBaseUrl,
    isLive,
    hasCredentials,
  };
}

/**
 * Checks and increments the daily counter. Resets if the day has changed.
 */
async function checkAndIncrementLimit(): Promise<{ ok: boolean; count: number; limit: number }> {
  const config = await prisma.whatsAppConfig.findUnique({ where: { id: 'global' } });
  if (!config) {
    return { ok: true, count: 0, limit: 250 };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = config.daily_counter;
  let resetDate = config.last_reset_date;

  if (resetDate < todayStart) {
    count = 0;
    resetDate = now;
  }

  if (count >= config.daily_limit) {
    return { ok: false, count, limit: config.daily_limit };
  }

  count += 1;
  await prisma.whatsAppConfig.update({
    where: { id: 'global' },
    data: {
      daily_counter: count,
      last_reset_date: resetDate,
    },
  });

  return { ok: true, count, limit: config.daily_limit };
}

/**
 * Logs a message attempt to the database.
 */
async function logMessage(data: {
  phone: string;
  recipientName?: string;
  recipientType: string;
  recipientUserId?: string;
  templateName?: string;
  variables?: any;
  metaMessageId?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  direction: 'OUTGOING' | 'INCOMING';
  rawRequest?: any;
  rawResponse?: any;
  costEstimation?: number;
  triggeredBy: string;
  automationType?: string;
}) {
  try {
    let templateId: string | undefined = undefined;
    if (data.templateName) {
      const tmpl = await prisma.whatsAppTemplate.findUnique({
        where: { name: data.templateName },
      });
      if (tmpl) {
        templateId = tmpl.id;
      }
    }

    return await prisma.whatsAppLog.create({
      data: {
        phone: data.phone,
        recipient_name: data.recipientName || null,
        recipient_type: data.recipientType,
        recipient_user_id: data.recipientUserId || null,
        template_id: templateId || null,
        variables: data.variables || null,
        meta_message_id: data.metaMessageId || null,
        status: data.status,
        error_code: data.errorCode || null,
        error_message: data.errorMessage || null,
        direction: data.direction,
        raw_request: data.rawRequest || null,
        raw_response: data.rawResponse || null,
        cost_estimation: data.costEstimation || 0.0,
        triggered_by: data.triggeredBy,
        automation_type: data.automationType || null,
        sent_at: data.status === 'SENT' || data.status === 'MOCK' ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Failed to log WhatsApp message to database:', error);
  }
}

/**
 * Sends a template message to a single phone number.
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  variables: string[],
  meta: MessageMeta = {}
) {
  const formattedPhone = formatPhoneNumber(phone);
  const config = await getWhatsAppConfig();
  const trigger = meta.triggeredBy || 'MANUAL';
  const recipientType = meta.recipientType || 'CUSTOM';

  // 1. Verify Daily Limit
  const limitCheck = await checkAndIncrementLimit();
  if (!limitCheck.ok) {
    const errorMsg = `Daily message limit of ${limitCheck.limit} exceeded (currently at ${limitCheck.count})`;
    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      templateName,
      variables,
      status: 'FAILED',
      errorMessage: errorMsg,
      direction: 'OUTGOING',
      triggeredBy: trigger,
      automationType: meta.automationType,
    });
    return { success: false, error: errorMsg, mode: config.isLive ? 'LIVE' : 'MOCK' };
  }

  // Construct request payload
  const bodyParams = variables.map((v) => ({ type: 'text', text: String(v) }));
  const components: any[] = [];
  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams,
    });
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components,
    },
  };

  // 2. Mock Mode handling
  if (!config.isLive) {
    const mockMsgId = `mock-msg-${randomUUID()}`;
    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      templateName,
      variables,
      metaMessageId: mockMsgId,
      status: 'MOCK',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: { mock: true, message: 'Message logged in mock mode' },
      triggeredBy: trigger,
      automationType: meta.automationType,
    });
    return { success: true, messageId: mockMsgId, mode: 'MOCK' };
  }

  // 3. Live Mode sending with retry wrapper
  try {
    const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const response = (await retryWithBackoff(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (!res.ok) {
        throw { status: res.status, data: json };
      }
      return json;
    }, 3, 1000)) as any;

    const metaMessageId = response.messages?.[0]?.id;

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      templateName,
      variables,
      metaMessageId,
      status: 'SENT',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: response,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: true, messageId: metaMessageId, mode: 'LIVE' };
  } catch (error: any) {
    console.error('Meta WhatsApp Send API failed:', error);
    const metaError = error.data?.error || {};
    const localErr = mapMetaError(metaError.code || error.status, metaError.message);

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      templateName,
      variables,
      status: 'FAILED',
      errorCode: String(metaError.code || error.status || ''),
      errorMessage: localErr.message,
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: error.data || error,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: false, error: localErr.message, code: metaError.code, mode: 'LIVE' };
  }
}

/**
 * Sends a free-form text message (within the 24hr customer session window).
 */
export async function sendTextMessage(phone: string, text: string, meta: MessageMeta = {}) {
  const formattedPhone = formatPhoneNumber(phone);
  const config = await getWhatsAppConfig();
  const trigger = meta.triggeredBy || 'MANUAL';
  const recipientType = meta.recipientType || 'CUSTOM';

  const limitCheck = await checkAndIncrementLimit();
  if (!limitCheck.ok) {
    const errorMsg = `Daily limit exceeded.`;
    await logMessage({
      phone: formattedPhone,
      recipientType,
      status: 'FAILED',
      errorMessage: errorMsg,
      direction: 'OUTGOING',
      triggeredBy: trigger,
    });
    return { success: false, error: errorMsg, mode: config.isLive ? 'LIVE' : 'MOCK' };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  if (!config.isLive) {
    const mockMsgId = `mock-msg-${randomUUID()}`;
    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { text },
      metaMessageId: mockMsgId,
      status: 'MOCK',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: { mock: true },
      triggeredBy: trigger,
      automationType: meta.automationType,
    });
    return { success: true, messageId: mockMsgId, mode: 'MOCK' };
  }

  try {
    const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const response = (await retryWithBackoff(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (!res.ok) {
        throw { status: res.status, data: json };
      }
      return json;
    }, 3, 1000)) as any;

    const metaMessageId = response.messages?.[0]?.id;

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { text },
      metaMessageId,
      status: 'SENT',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: response,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: true, messageId: metaMessageId, mode: 'LIVE' };
  } catch (error: any) {
    const metaError = error.data?.error || {};
    const localErr = mapMetaError(metaError.code || error.status, metaError.message);

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { text },
      status: 'FAILED',
      errorCode: String(metaError.code || error.status || ''),
      errorMessage: localErr.message,
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: error.data || error,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: false, error: localErr.message, code: metaError.code, mode: 'LIVE' };
  }
}

/**
 * Sends a media message (image, document, video, audio).
 */
export async function sendMediaMessage(phone: string, type: 'image' | 'document' | 'video' | 'audio', url: string, caption?: string, filename?: string, meta: MessageMeta = {}) {
  const formattedPhone = formatPhoneNumber(phone);
  const config = await getWhatsAppConfig();
  const trigger = meta.triggeredBy || 'MANUAL';
  const recipientType = meta.recipientType || 'CUSTOM';

  const limitCheck = await checkAndIncrementLimit();
  if (!limitCheck.ok) {
    return { success: false, error: 'Daily limit exceeded', mode: config.isLive ? 'LIVE' : 'MOCK' };
  }

  // Construct media payload
  const mediaObj: any = { link: url };
  if (caption && (type === 'image' || type === 'video')) {
    mediaObj.caption = caption;
  }
  if (filename && type === 'document') {
    mediaObj.filename = filename;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type,
    [type]: mediaObj,
  };

  if (!config.isLive) {
    const mockMsgId = `mock-msg-${randomUUID()}`;
    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { type, url, caption, filename },
      metaMessageId: mockMsgId,
      status: 'MOCK',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: { mock: true },
      triggeredBy: trigger,
      automationType: meta.automationType,
    });
    return { success: true, messageId: mockMsgId, mode: 'MOCK' };
  }

  try {
    const apiURL = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const response = (await retryWithBackoff(async () => {
      const res = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (!res.ok) {
        throw { status: res.status, data: json };
      }
      return json;
    }, 3, 1000)) as any;

    const metaMessageId = response.messages?.[0]?.id;

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { type, url, caption },
      metaMessageId,
      status: 'SENT',
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: response,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: true, messageId: metaMessageId, mode: 'LIVE' };
  } catch (error: any) {
    const metaError = error.data?.error || {};
    const localErr = mapMetaError(metaError.code || error.status, metaError.message);

    await logMessage({
      phone: formattedPhone,
      recipientName: meta.recipientName,
      recipientType,
      recipientUserId: meta.recipientUserId,
      variables: { type, url, caption },
      status: 'FAILED',
      errorCode: String(metaError.code || error.status || ''),
      errorMessage: localErr.message,
      direction: 'OUTGOING',
      rawRequest: payload,
      rawResponse: error.data || error,
      triggeredBy: trigger,
      automationType: meta.automationType,
    });

    return { success: false, error: localErr.message, code: metaError.code, mode: 'LIVE' };
  }
}

/**
 * Fetch templates directly from Meta API.
 */
export async function getTemplatesFromMeta() {
  const config = await getWhatsAppConfig();
  if (!config.hasCredentials) {
    throw new Error('Meta API credentials are not configured.');
  }

  const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.businessAccountId}/message_templates`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.accessToken}` },
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch templates from Meta');
  }

  return json.data || [];
}

/**
 * Create a template on Meta.
 */
export async function createTemplateOnMeta(templateData: any) {
  const config = await getWhatsAppConfig();
  if (!config.hasCredentials) {
    return { success: false, error: 'Meta credentials missing. Local-only mode active.' };
  }

  const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.businessAccountId}/message_templates`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to create template on Meta');
  }

  return json;
}

/**
 * Delete a template on Meta.
 */
export async function deleteTemplateOnMeta(templateName: string) {
  const config = await getWhatsAppConfig();
  if (!config.hasCredentials) {
    return { success: false, error: 'Meta credentials missing. Local-only mode active.' };
  }

  const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.businessAccountId}/message_templates?name=${templateName}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${config.accessToken}` },
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to delete template on Meta');
  }

  return json;
}

/**
 * Get business phone info from Meta API.
 */
export async function getPhoneNumberInfo() {
  const config = await getWhatsAppConfig();
  if (!config.hasCredentials) {
    throw new Error('Meta credentials missing.');
  }

  const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.accessToken}` },
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.error?.message || 'Failed to fetch phone number info');
  }

  return json;
}

/**
 * Tests connection to Meta API by verifying verify token and hitting phone info endpoint.
 */
export async function verifyConnection() {
  const config = await getWhatsAppConfig();
  if (!config.hasCredentials) {
    return { success: false, status: 'DISCONNECTED', message: 'Credentials missing' };
  }

  if (config.is_mock_mode) {
    return { success: true, status: 'MOCK', message: 'Mock connection active' };
  }

  try {
    const info = await getPhoneNumberInfo();
    return { success: true, status: 'CONNECTED', data: info };
  } catch (error: any) {
    return { success: false, status: 'DISCONNECTED', message: error.message || 'Meta connection test failed' };
  }
}

/**
 * Validates whether a phone number is registered on WhatsApp (in LIVE mode calls Meta API).
 */
export async function validatePhoneNumber(phone: string) {
  const formattedPhone = formatPhoneNumber(phone);
  const config = await getWhatsAppConfig();

  if (!config.isLive) {
    // In mock mode, we assume all properly formatted numbers of length >= 10 are valid
    return { success: true, valid: formattedPhone.length >= 10, phone: formattedPhone };
  }

  try {
    // Note: WhatsApp Cloud API does not expose a direct single-number validation endpoint for free.
    // However, we can query Meta's contacts API if it's available or simulate a verification check.
    // For standard direct Cloud API integrations, businesses check formatting, or call Meta contact verification.
    const url = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}/contacts`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocking: 'wait',
        contacts: [formattedPhone],
        force_check: true,
      }),
    });

    const json = (await res.json()) as any;
    if (!res.ok) {
      throw new Error(json.error?.message || 'Verification endpoint error');
    }

    const contactStatus = json.contacts?.[0]?.status;
    return {
      success: true,
      valid: contactStatus === 'valid',
      phone: formattedPhone,
      status: contactStatus,
    };
  } catch (error: any) {
    console.error('Phone number validation failed:', error.message);
    // Graceful fallback: validate local format if API call fails
    return { success: false, valid: formattedPhone.length >= 10, phone: formattedPhone, error: error.message };
  }
}
