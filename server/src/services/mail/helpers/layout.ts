import { env } from '../../../config/env';

interface LayoutOptions {
  title: string;
  preheader?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const getBaseHtmlLayout = (contentHtml: string, options: LayoutOptions): string => {
  const appName = env.APP_NAME;
  const logoUrl = `${env.APP_URL}/logo.png`; // Fallback image or branding asset
  
  const ctaSection = options.ctaText && options.ctaUrl
    ? `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${options.ctaUrl}" target="_blank" style="background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(49, 46, 129, 0.15); transition: all 0.2s ease;">
          ${options.ctaText}
        </a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
      ${options.preheader ? `<span style="display: none; max-height: 0px; overflow: hidden;">${options.preheader}</span>` : ''}
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          background-color: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1E293B;
          -webkit-font-smoothing: antialiased;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            padding: 16px !important;
          }
          .content-card {
            padding: 24px !important;
          }
        }
      </style>
    </head>
    <body style="background-color: #F8FAFC; padding: 40px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; margin: 0 auto;">
              <!-- Header / Logo -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <div style="font-size: 24px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.03em; font-family: 'Poppins', sans-serif;">
                          ${appName}
                        </div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748B; margin-top: 4px;">
                          Enterprise ERP Platform
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content Card -->
              <tr>
                <td>
                  <div class="content-card" style="background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.02); border: 1px solid rgba(226, 232, 240, 0.8);">
                    
                    <!-- Content Inject -->
                    ${contentHtml}
                    
                    <!-- Optional CTA -->
                    ${ctaSection}
                    
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 32px 24px 0; text-align: center;">
                  <p style="font-size: 13px; color: #94A3B8; margin: 0; line-height: 1.6; font-weight: 500;">
                    This is an automated operational notification from <strong>${appName}</strong>.<br />
                    Please do not reply directly to this email.
                  </p>
                  <p style="font-size: 12px; color: #CBD5E1; margin-top: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
