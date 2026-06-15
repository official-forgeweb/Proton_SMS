import prisma from '../../config/database';
import { createTemplateOnMeta, deleteTemplateOnMeta, getTemplatesFromMeta } from './whatsapp.service';

/**
 * Creates a template locally.
 */
export async function createLocalTemplate(data: {
  name: string;
  category: string;
  language: string;
  header_type?: string;
  header_content?: string;
  body_text: string;
  footer_text?: string;
  buttons?: any;
  variables_description?: any;
  sample_values?: any;
  created_by_id?: string;
}) {
  const nameClean = data.name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  
  validateTemplateStructure(data);

  return await prisma.whatsAppTemplate.create({
    data: {
      name: nameClean,
      category: data.category || 'UTILITY',
      language: data.language || 'en_US',
      header_type: data.header_type || 'NONE',
      header_content: data.header_content || null,
      body_text: data.body_text,
      footer_text: data.footer_text || null,
      buttons: data.buttons || null,
      variables_description: data.variables_description || null,
      sample_values: data.sample_values || null,
      status: 'DRAFT',
      sync_status: 'LOCAL_ONLY',
      created_by_id: data.created_by_id || null,
    },
  });
}

/**
 * Validates local template structure.
 */
export function validateTemplateStructure(data: any) {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Template name is required and must be a string');
  }
  if (!data.body_text || typeof data.body_text !== 'string') {
    throw new Error('Template body text is required');
  }

  // Count variables in body e.g. {{1}}, {{2}}
  const bodyMatches = data.body_text.match(/\{\{\d+\}\}/g) || [];
  const bodyVarCount = new Set(bodyMatches).size;

  // Ensure sample values are provided for variables if pushed to Meta
  if (bodyVarCount > 0) {
    const samples = data.sample_values;
    if (!samples || (Array.isArray(samples) && samples.length < bodyVarCount)) {
      throw new Error(`Template requires at least ${bodyVarCount} sample values for review`);
    }
  }
}

/**
 * Generates an HTML-like formatted preview of a WhatsApp message.
 */
export function generatePreview(
  template: {
    body_text: string;
    header_type?: string;
    header_content?: string;
    footer_text?: string;
    buttons?: any;
  },
  variables: string[] | Record<string, string> = []
): string {
  let body = template.body_text;

  // 1. Replace variables
  if (Array.isArray(variables)) {
    variables.forEach((val, idx) => {
      body = body.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val || `{{${idx + 1}}}`);
    });
  } else if (variables && typeof variables === 'object') {
    Object.entries(variables).forEach(([key, val]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `{{${key}}}`);
    });
  }

  // 2. Format WhatsApp Markdown rules
  body = body
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/```([^`]+)```/g, '<code>$1</code>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br />');

  // 3. Assemble components
  let html = '<div class="whatsapp-preview-bubble text-sm font-sans leading-relaxed">';
  
  if (template.header_type === 'TEXT' && template.header_content) {
    let header = template.header_content;
    if (Array.isArray(variables)) {
      variables.forEach((val, idx) => {
        header = header.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val || `{{${idx + 1}}}`);
      });
    }
    html += `<div class="whatsapp-preview-header font-bold text-gray-800 mb-1 border-bottom pb-1">${header}</div>`;
  } else if (template.header_type && template.header_type !== 'NONE' && template.header_content) {
    html += `<div class="whatsapp-preview-media bg-gray-100 border rounded flex items-center justify-center p-3 text-xs text-gray-500 mb-2">📁 Meta Header (${template.header_type})</div>`;
  }

  html += `<div class="whatsapp-preview-body text-gray-700">${body}</div>`;

  if (template.footer_text) {
    html += `<div class="whatsapp-preview-footer text-xs text-gray-400 mt-1">${template.footer_text}</div>`;
  }

  if (template.buttons && Array.isArray(template.buttons)) {
    html += '<div class="whatsapp-preview-buttons mt-3 pt-2 border-t flex flex-col gap-1.5">';
    template.buttons.forEach((btn: any) => {
      const label = btn.text || 'Button';
      html += `<div class="whatsapp-preview-btn bg-white border border-gray-200 text-blue-500 text-center py-1.5 rounded text-xs font-semibold cursor-pointer shadow-sm hover:bg-gray-50">${label}</div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/**
 * Pushes a local template draft to Meta API.
 */
export async function pushTemplateToMeta(templateId: string) {
  const template = await prisma.whatsAppTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const components: any[] = [];

  // 1. Build Header Component
  if (template.header_type && template.header_type !== 'NONE') {
    const headerComp: any = {
      type: 'HEADER',
      format: template.header_type,
    };
    if (template.header_type === 'TEXT' && template.header_content) {
      headerComp.text = template.header_content;
      
      // Match headers variables
      const headerMatches = template.header_content.match(/\{\{\d+\}\}/g) || [];
      if (headerMatches.length > 0) {
        headerComp.example = {
          header_text: [(template.sample_values as any)?.[0] || 'Example Header'],
        };
      }
    }
    components.push(headerComp);
  }

  // 2. Build Body Component
  const bodyMatches = template.body_text.match(/\{\{\d+\}\}/g) || [];
  const bodyVarCount = new Set(bodyMatches).size;
  const bodyComp: any = {
    type: 'BODY',
    text: template.body_text,
  };

  if (bodyVarCount > 0 && template.sample_values) {
    const samples = Array.isArray(template.sample_values)
      ? template.sample_values
      : JSON.parse(template.sample_values as string || '[]');
    
    // Meta requires an array of arrays of strings for body_text examples
    bodyComp.example = {
      body_text: [samples.slice(0, bodyVarCount)],
    };
  }
  components.push(bodyComp);

  // 3. Build Footer Component
  if (template.footer_text) {
    components.push({
      type: 'FOOTER',
      text: template.footer_text,
    });
  }

  // 4. Build Buttons Component
  if (template.buttons) {
    const buttonsList = Array.isArray(template.buttons)
      ? template.buttons
      : JSON.parse(template.buttons as string || '[]');
    if (buttonsList.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttonsList.map((btn: any, idx: number) => {
          const formattedBtn: any = {
            type: btn.type || 'QUICK_REPLY',
            text: btn.text,
          };
          if (formattedBtn.type === 'URL') {
            formattedBtn.url = btn.url || 'https://protoncoaching.com';
            if (btn.url?.includes('{{1}}')) {
              formattedBtn.example = [btn.sample_url || 'https://protoncoaching.com/student'];
            }
          } else if (formattedBtn.type === 'PHONE_NUMBER') {
            formattedBtn.phone_number = btn.phone_number || '+910000000000';
          }
          return formattedBtn;
        }),
      });
    }
  }

  const metaPayload = {
    name: template.name,
    category: template.category,
    language: template.language,
    components,
  };

  try {
    const metaResponse = (await createTemplateOnMeta(metaPayload)) as any;
    
    // Update local sync status
    await prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: {
        meta_template_id: metaResponse.id || null,
        status: 'PENDING',
        sync_status: 'SYNCED',
        rejection_reason: null,
      },
    });

    return { success: true, metaResponse };
  } catch (error: any) {
    console.error(`Failed to push template ${template.name} to Meta:`, error);
    
    await prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: {
        sync_status: 'OUT_OF_SYNC',
        rejection_reason: error.message || 'Meta API creation failed',
      },
    });

    throw error;
  }
}

/**
 * Pull and sync template status from Meta for a single template.
 */
export async function syncTemplateWithMeta(templateId: string) {
  const localTemplate = await prisma.whatsAppTemplate.findUnique({
    where: { id: templateId },
  });

  if (!localTemplate) {
    throw new Error('Local template not found');
  }

  try {
    const metaTemplates = await getTemplatesFromMeta();
    const metaTemplate = metaTemplates.find((t: any) => t.name === localTemplate.name);

    if (!metaTemplate) {
      // Not found on Meta, mark local only
      await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: {
          sync_status: 'LOCAL_ONLY',
          status: 'DRAFT',
        },
      });
      return { status: 'DRAFT', synced: false };
    }

    // Map Meta statuses (APPROVED, REJECTED, PAUSED, PENDING)
    const updated = await prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: {
        meta_template_id: metaTemplate.id,
        status: metaTemplate.status,
        category: metaTemplate.category,
        language: metaTemplate.language,
        sync_status: 'SYNCED',
        rejection_reason: metaTemplate.reason || null,
      },
    });

    return { status: updated.status, synced: true };
  } catch (error: any) {
    console.error(`Failed to sync template ${localTemplate.name}:`, error.message);
    throw error;
  }
}

/**
 * Pull and sync all templates from Meta.
 */
export async function syncAllFromMeta() {
  try {
    const metaTemplates = await getTemplatesFromMeta();
    let syncedCount = 0;

    for (const metaTmpl of metaTemplates) {
      const localTmpl = await prisma.whatsAppTemplate.findUnique({
        where: { name: metaTmpl.name },
      });

      // Map Meta template components back to local columns
      let bodyText = '';
      let headerType = 'NONE';
      let headerContent = '';
      let footerText = '';
      const buttons: any[] = [];

      metaTmpl.components?.forEach((comp: any) => {
        if (comp.type === 'BODY') {
          bodyText = comp.text;
        } else if (comp.type === 'HEADER') {
          headerType = comp.format;
          headerContent = comp.text || '';
        } else if (comp.type === 'FOOTER') {
          footerText = comp.text;
        } else if (comp.type === 'BUTTONS') {
          comp.buttons?.forEach((btn: any) => {
            buttons.push({
              type: btn.type,
              text: btn.text,
              url: btn.url,
              phone_number: btn.phone_number,
            });
          });
        }
      });

      if (localTmpl) {
        // Update local template status and metadata
        await prisma.whatsAppTemplate.update({
          where: { id: localTmpl.id },
          data: {
            meta_template_id: metaTmpl.id,
            status: metaTmpl.status,
            category: metaTmpl.category,
            language: metaTmpl.language,
            sync_status: 'SYNCED',
            rejection_reason: metaTmpl.reason || null,
          },
        });
      } else {
        // Create local record if missing
        await prisma.whatsAppTemplate.create({
          data: {
            name: metaTmpl.name,
            meta_template_id: metaTmpl.id,
            category: metaTmpl.category,
            language: metaTmpl.language,
            status: metaTmpl.status,
            header_type: headerType,
            header_content: headerContent || null,
            body_text: bodyText || '[Synced template body missing]',
            footer_text: footerText || null,
            buttons: buttons.length > 0 ? (buttons as any) : undefined,
            sync_status: 'SYNCED',
            rejection_reason: metaTmpl.reason || null,
          },
        });
      }
      syncedCount++;
    }

    return syncedCount;
  } catch (error: any) {
    console.error('Failed to sync all templates from Meta:', error.message);
    throw error;
  }
}

/**
 * Delete a template locally and optionally on Meta.
 */
export async function deleteTemplate(templateId: string, deleteOnMeta: boolean = false) {
  const localTemplate = await prisma.whatsAppTemplate.findUnique({
    where: { id: templateId },
  });

  if (!localTemplate) {
    throw new Error('Template not found');
  }

  if (deleteOnMeta && localTemplate.sync_status === 'SYNCED') {
    try {
      await deleteTemplateOnMeta(localTemplate.name);
    } catch (error) {
      console.warn(`Could not delete template ${localTemplate.name} on Meta API, deleting locally anyway.`);
    }
  }

  return await prisma.whatsAppTemplate.delete({
    where: { id: templateId },
  });
}
