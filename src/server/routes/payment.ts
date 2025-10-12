import express from 'express';
import paystack from 'paystack';
import { db } from '../database/init';

const router = express.Router();
const paystackClient = paystack(process.env.PAYSTACK_SECRET_KEY || '');

// Create Paystack customer
router.post('/create-customer', async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;
    
    const customer = await paystackClient.customer.create({
      email,
      first_name,
      last_name
    });

    // Update user with Paystack customer ID
    db.run(
      'UPDATE users SET paystack_customer_id = ? WHERE email = ?',
      [customer.data.customer_code, email],
      (err) => {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ customerCode: customer.data.customer_code });
      }
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize payment
router.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount, plan } = req.body;
    
    const payment = await paystackClient.transaction.initialize({
      email,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      metadata: {
        plan: plan
      }
    });

    res.json({
      authorization_url: payment.data.authorization_url,
      access_code: payment.data.access_code,
      reference: payment.data.reference
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.body;
    
    const verification = await paystackClient.transaction.verify(reference);
    
    if (verification.data.status === 'success') {
      // Update user subscription
      const { plan } = verification.data.metadata;
      const userEmail = verification.data.customer.email;
      
      db.run(
        `UPDATE users 
         SET subscription_plan = ?, 
             subscription_status = 'active',
             subscription_end_date = datetime('now', '+1 month')
         WHERE email = ?`,
        [plan, userEmail],
        (err) => {
          if (err) {
            console.error('Error updating subscription:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({ success: true, plan: plan });
        }
      );
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;