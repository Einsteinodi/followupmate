import nodemailer from 'nodemailer';
import { db } from '../database/init';

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
    }
  });
};

// Template variable replacement
export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

// Send follow-up email
export async function sendFollowUpEmail(
  followUpId: number,
  templateId: number,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get follow-up details
    const followUp = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM followups WHERE id = ?',
        [followUpId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!followUp) {
      return { success: false, error: 'Follow-up not found' };
    }

    // Get email template
    const template = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM email_templates WHERE id = ?',
        [templateId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Prepare template variables
    const variables = {
      client_name: followUp.client_name,
      your_name: userName,
      project_type: 'proposal', // Could be made dynamic
      company_name: 'Your Company' // Could be stored in user profile
    };

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject, variables);
    const body = replaceTemplateVariables(template.body, variables);

    // Create email transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"${userName}" <${userEmail}>`,
      to: followUp.client_email,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log email sent
    db.run(
      'INSERT INTO email_logs (followup_id, email_type, sent_at, status) VALUES (?, ?, ?, ?)',
      [followUpId, 'follow_up', new Date().toISOString(), 'sent']
    );

    // Update follow-up status
    const nextFollowUpDate = calculateNextFollowUpDate(followUp);
    
    db.run(
      `UPDATE followups 
       SET follow_up_count = follow_up_count + 1,
           last_follow_up_date = CURRENT_TIMESTAMP,
           next_follow_up_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextFollowUpDate, followUpId]
    );

    console.log(`📧 Follow-up email sent to ${followUp.client_email}: ${info.messageId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // Log failed email
    db.run(
      'INSERT INTO email_logs (followup_id, email_type, sent_at, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [followUpId, 'follow_up', new Date().toISOString(), 'failed', error?.message || 'Unknown error']
    );

    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// Calculate next follow-up date based on sequence
function calculateNextFollowUpDate(followUp: any): string | null {
  const followUpDelays = [3, 7, 14]; // Default delays in days
  const currentCount = followUp.follow_up_count + 1; // +1 because we just sent one
  
  if (currentCount >= followUp.max_follow_ups) {
    return null; // No more follow-ups
  }
  
  const nextDelay = followUpDelays[currentCount] || followUpDelays[followUpDelays.length - 1];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextDelay);
  
  return nextDate.toISOString();
}

// Send test email
export async function sendTestEmail(
  to: string,
  subject: string,
  body: string,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}