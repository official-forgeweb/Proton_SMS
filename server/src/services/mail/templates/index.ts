import { getBaseHtmlLayout } from '../helpers/layout';
import { env } from '../../../config/env';

export const templates = {
  // Student Welcome Onboarding
  studentWelcome: (data: { name: string; email: string; proId: string; tempPass: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Welcome to Proton, ${data.name}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Your student profile has been successfully enrolled in our system. You now have access to your courses, schedules, academic resources, and fee statements.
      </p>
      
      <!-- Credentials Panel -->
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.5px;">Your Credentials</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 120px;"><strong>Student ID:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-family: monospace; font-weight: 700;">${data.proId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Login Email:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-weight: 600;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Temp Password:</strong></td>
            <td style="padding: 6px 0; color: #DC2626; font-family: monospace; font-weight: 700;">${data.tempPass}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        ⚠️ <strong>Important Security Notice:</strong> Please make sure to reset your password immediately upon your first login to secure your account.
      </p>
    `;
    
    return getBaseHtmlLayout(content, {
      title: 'Welcome to Proton SMS',
      preheader: 'Welcome to Proton SMS! Here are your account credentials.',
      ctaText: 'Access Student Dashboard',
      ctaUrl: env.APP_URL,
    });
  },

  // Teacher Onboarding
  teacherOnboarding: (data: { name: string; email: string; employeeId: string; tempPass: string; role: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Welcome on Board, ${data.name}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Your educator account has been established under the role of <strong>${data.role}</strong>. You now have permission to manage cohorts, record attendance, issue homework, and coordinate educational plans.
      </p>
      
      <!-- Credentials Panel -->
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.5px;">Your Educator Profile</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 120px;"><strong>Employee ID:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-family: monospace; font-weight: 700;">${data.employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Login Email:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-weight: 600;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Temp Password:</strong></td>
            <td style="padding: 6px 0; color: #DC2626; font-family: monospace; font-weight: 700;">${data.tempPass}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        🛡️ Please log in and set up your dynamic password immediately. Secure multi-factor options are recommended.
      </p>
    `;
    
    return getBaseHtmlLayout(content, {
      title: 'Teacher Onboarding Invitation',
      preheader: 'Welcome on board! Set up your educator access.',
      ctaText: 'Access Teacher Portal',
      ctaUrl: env.APP_URL,
    });
  },

  // Coordinator Onboarding
  coordinatorOnboarding: (data: { name: string; email: string; coordinatorId: string; tempPass: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Welcome, ${data.name}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        You have been appointed as a <strong>Coordinator</strong> in Proton SMS ERP. Your role allows complete class oversight, timetable orchestration, fee allocations, and administrative audits.
      </p>
      
      <!-- Credentials Panel -->
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.5px;">Your Profile Details</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 120px;"><strong>Coordinator ID:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-family: monospace; font-weight: 700;">${data.coordinatorId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Login Email:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-weight: 600;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Temp Password:</strong></td>
            <td style="padding: 6px 0; color: #DC2626; font-family: monospace; font-weight: 700;">${data.tempPass}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        ⚠️ Secure your account by resetting your access password upon authentication.
      </p>
    `;
    
    return getBaseHtmlLayout(content, {
      title: 'Coordinator Onboarding Invitation',
      preheader: 'Welcome on board! Here is your coordinator access.',
      ctaText: 'Access Coordinator Portal',
      ctaUrl: env.APP_URL,
    });
  },

  // Fee Assigned
  feeAssigned: (data: { name: string; amount: number; structureName: string; installments: Array<{ date: string; amount: number }> }) => {
    const installmentRows = data.installments.map((inst, index) => `
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 8px 0; color: #475569;">Installment #${index + 1}</td>
        <td style="padding: 8px 0; color: #1E1B4B; font-weight: 600;">INR ${inst.amount}</td>
        <td style="padding: 8px 0; color: #E53935; font-weight: 700;">${new Date(inst.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      </tr>
    `).join('');

    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Fee Statement Assigned</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, a fee assignment of <strong>INR ${data.amount}</strong> under the program <strong>${data.structureName}</strong> has been allocated to your profile.
      </p>
      
      <!-- Fee Summary -->
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.5px;">Payment & Installment Overview</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #E2E8F0; text-align: left;">
              <th style="padding-bottom: 8px; color: #64748B;">Installment</th>
              <th style="padding-bottom: 8px; color: #64748B;">Amount</th>
              <th style="padding-bottom: 8px; color: #64748B;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${installmentRows}
          </tbody>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        💳 You can complete partial/installment payments directly through your student financial section.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Fee Statement Assigned',
      preheader: 'New fee statement is assigned. Check installment schedules.',
      ctaText: 'View Financial Statement',
      ctaUrl: env.APP_URL,
    });
  },

  // Installment Date Changed
  installmentUpdated: (data: { name: string; amount: number; dueDate: string }) => {
    const formattedDate = new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Installment Schedule Adjusted</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, your installment due date has been modified by the administrative office.
      </p>
      
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.5px;">Updated Installment Schedule</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 120px;"><strong>Amount:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-weight: 700;">INR ${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>New Due Date:</strong></td>
            <td style="padding: 6px 0; color: #E53935; font-weight: 700;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        Please make sure payments are initiated before the updated due date to ensure continuous access to your portal resources.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Installment Schedule Adjusted',
      preheader: 'An installment due date has been modified.',
      ctaText: 'View Fees Details',
      ctaUrl: env.APP_URL,
    });
  },

  // Payment Success Recorded
  paymentSuccess: (data: { name: string; amountPaid: number; remainingBalance: number; txRef: string; date: string }) => {
    const formattedDate = new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #059669; letter-spacing: -0.02em;">Payment Confirmation</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, your payment has been successfully recorded in the Proton system.
      </p>
      
      <!-- Receipt Box -->
      <div style="background: #ECFDF5; border-radius: 16px; padding: 24px; border: 1px solid #A7F3D0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Receipt Summary</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #065F46; width: 140px;"><strong>Transaction Ref:</strong></td>
            <td style="padding: 6px 0; color: #047857; font-family: monospace; font-weight: 700;">${data.txRef}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065F46;"><strong>Amount Paid:</strong></td>
            <td style="padding: 6px 0; color: #047857; font-weight: 800; font-size: 16px;">INR ${data.amountPaid}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065F46;"><strong>Recorded At:</strong></td>
            <td style="padding: 6px 0; color: #047857; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr style="border-top: 1px solid #A7F3D0;">
            <td style="padding: 10px 0 0; color: #065F46;"><strong>Remaining Balance:</strong></td>
            <td style="padding: 10px 0 0; color: #DC2626; font-weight: 700;">INR ${data.remainingBalance}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        Thank you for your transaction. A downloadable formal invoice is generated inside your dashboard.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Payment Confirmation Receipt',
      preheader: 'Payment successful! Transaction reference details inside.',
      ctaText: 'Download Invoice',
      ctaUrl: env.APP_URL,
    });
  },

  // Enquiry Resolved
  enquiryResolved: (data: { name: string; subject: string; response: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Enquiry Resolved</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, your recently filed enquiry has been resolved by our administrative representative.
      </p>
      
      <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h4 style="margin: 0 0 6px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Enquiry Title</h4>
        <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #1E1B4B;">${data.subject}</p>
        
        <h4 style="margin: 0 0 6px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Resolution Response</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; font-style: italic; background: white; border-radius: 8px; padding: 12px; border: 1px solid #F1F5F9;">
          &ldquo;${data.response}&rdquo;
        </p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        If this resolution requires further explanation or is incomplete, please re-open the thread or contact our campus helpdesk.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Enquiry Resolution Notice',
      preheader: 'Your filed enquiry has been successfully resolved.',
      ctaText: 'View On Site',
      ctaUrl: env.APP_URL,
    });
  },

  // Timetable Updated
  timetableUpdated: (data: { name: string; details: string; date: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Timetable Schedule Changed</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, your class schedule has been updated by the coordinators.
      </p>
      
      <div style="background: #FFFBEB; border-radius: 16px; padding: 24px; border: 1px solid #FEF3C7; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px;">Schedule Changes</h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #B45309; width: 120px;"><strong>Effective Date:</strong></td>
            <td style="padding: 6px 0; color: #1E1B4B; font-weight: 700;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #B45309; vertical-align: top;"><strong>Update:</strong></td>
            <td style="padding: 6px 0; color: #475569; font-weight: 500; line-height: 1.5;">${data.details}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0;">
        We recommend reviewing your dynamic calendar inside the ERP to prevent scheduling conflicts.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Timetable Schedule Change Notice',
      preheader: 'Your timetable schedule has been adjusted.',
      ctaText: 'View Timetable',
      ctaUrl: env.APP_URL,
    });
  },

  // Password Reset Link
  passwordReset: (data: { name: string; resetUrl: string }) => {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.02em;">Password Reset Requested</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Hello ${data.name}, a request to reset your credentials was made on our portal.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        If you initiated this, please click the secure link below to update your security parameters. The link remains valid for 1 hour.
      </p>
      
      <p style="font-size: 13px; line-height: 1.5; color: #94A3B8; margin: 24px 0 0;">
        If you did not make this request, you can safely ignore this email; your current passcode remains completely secure.
      </p>
    `;

    return getBaseHtmlLayout(content, {
      title: 'Password Reset Instruction',
      preheader: 'Instructions on how to reset your secure access password.',
      ctaText: 'Reset Password',
      ctaUrl: data.resetUrl,
    });
  }
};
