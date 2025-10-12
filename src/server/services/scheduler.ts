import cron from 'node-cron';
import { db } from '../database/init';
import { sendFollowUpEmail } from './emailService';

// Run every hour to check for due follow-ups
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running follow-up check...');
  await processDueFollowUps();
});

// Process follow-ups that are due
export async function processDueFollowUps(): Promise<void> {
  try {
    // Get all follow-ups that are due and haven't been replied to
    const dueFollowUps = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT f.*, u.email as user_email, u.name as user_name
         FROM followups f
         JOIN users u ON f.user_id = u.id
         WHERE f.next_follow_up_date <= datetime('now')
         AND f.client_replied = 0
         AND f.follow_up_count < f.max_follow_ups
         AND f.status != 'completed'`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`�� Found ${dueFollowUps.length} due follow-ups`);

    for (const followUp of dueFollowUps) {
      try {
        // Get the appropriate template based on follow-up count
        const template = await new Promise<any>((resolve, reject) => {
          db.get(
            'SELECT * FROM email_templates WHERE user_id = ? AND is_default = 1 ORDER BY id LIMIT 1 OFFSET ?',
            [followUp.user_id, followUp.follow_up_count],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (template) {
          const result = await sendFollowUpEmail(
            followUp.id,
            template.id,
            followUp.user_email,
            followUp.user_name
          );

          if (result.success) {
            console.log(`✅ Sent follow-up ${followUp.follow_up_count + 1} to ${followUp.client_email}`);
          } else {
            console.error(`❌ Failed to send follow-up to ${followUp.client_email}: ${result.error}`);
          }
        } else {
          console.warn(`⚠️ No template found for follow-up ${followUp.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing follow-up ${followUp.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in processDueFollowUps:', error);
  }
}

// Manual trigger for testing
export async function triggerFollowUpCheck(): Promise<void> {
  console.log('🔧 Manually triggering follow-up check...');
  await processDueFollowUps();
}