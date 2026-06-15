export interface LocalizedError {
  code: number | string;
  message: string;
  action: 'RETRY' | 'QUEUE' | 'FAIL' | 'TEMPLATE_REQUIRED' | 'ALERT_ADMIN' | 'INVALID_TOKEN' | 'BAD_REQUEST' | 'NONE';
}

/**
 * Maps Meta WhatsApp Business API error codes to standard internal messages and actions.
 * 
 * @param code Meta error code
 * @param originalMessage Original error message from Meta API
 */
export function mapMetaError(code: number | string, originalMessage?: string): LocalizedError {
  const codeNum = typeof code === 'string' ? parseInt(code, 10) : code;

  switch (codeNum) {
    case 131051:
      return {
        code: 131051,
        message: 'Message delivery failed. The system will retry automatically.',
        action: 'RETRY',
      };
    case 131053:
      return {
        code: 131053,
        message: 'Rate limit hit. The message is queued and will be retried.',
        action: 'QUEUE',
      };
    case 131026:
      return {
        code: 131026,
        message: 'Undeliverable. The phone number is not on WhatsApp or cannot receive messages.',
        action: 'FAIL',
      };
    case 131047:
      return {
        code: 131047,
        message: 'Re-engagement needed. You cannot send free-form text outside the 24-hour window; a template must be used.',
        action: 'TEMPLATE_REQUIRED',
      };
    case 131031:
      return {
        code: 131031,
        message: 'WhatsApp Business Account is paused or restricted. Please check your Meta Business Suite.',
        action: 'ALERT_ADMIN',
      };
    case 190:
      return {
        code: 190,
        message: 'Invalid or expired Meta Access Token. Please update your WhatsApp settings.',
        action: 'INVALID_TOKEN',
      };
    case 100:
      return {
        code: 100,
        message: originalMessage || 'Invalid parameter provided to Meta API. Check template variables or phone format.',
        action: 'BAD_REQUEST',
      };
    default:
      return {
        code: code || 'UNKNOWN',
        message: originalMessage || 'An unexpected Meta WhatsApp API error occurred.',
        action: 'NONE',
      };
  }
}
