import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'registration_confirmation',
    subject: 'Registration Confirmation - K-MUN 2025',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation - K-MUN 2025</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #172d9d, #797dfa); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #172d9d; }
          .detail-value { color: #666; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #172d9d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <h2>Kumaraguru MUN 2025</h2>
          </div>
          
          <div class="content">
            <p>Dear {{firstName}} {{lastName}},</p>
            
            <p>Congratulations! Your registration for Kumaraguru MUN 2025 has been successfully submitted. We're excited to have you join us for this incredible experience.</p>
            
            <div class="details">
              <h3>📋 Registration Details</h3>
              <div class="detail-row">
                <span class="detail-label">Registration ID:</span>
                <span class="detail-value">{{registrationId}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{firstName}} {{lastName}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Institution:</span>
                <span class="detail-value">{{institution}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Committee Preference 1:</span>
                <span class="detail-value">{{committeePreference1}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Committee Preference 2:</span>
                <span class="detail-value">{{committeePreference2}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Committee Preference 3:</span>
                <span class="detail-value">{{committeePreference3}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Fee:</span>
                <span class="detail-value">₹{{paymentAmount}}</span>
              </div>
            </div>
            
            <h3>📧 Login Credentials</h3>
            <p>Your login credentials have been sent to your email address. Please check your inbox for your temporary password.</p>
            
            <h3>💳 Payment Information</h3>
            <p>To complete your registration, please proceed with the payment. You can make the payment through our secure payment gateway.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kmun.kct.ac.in/login" class="button">Complete Payment</a>
            </div>
            
            <h3>📅 What's Next?</h3>
            <ul>
              <li>Complete your payment to secure your spot</li>
              <li>Check your email regularly for updates</li>
              <li>Committee allocations will be announced soon</li>
              <li>Background guides and preparation materials will be shared</li>
            </ul>
            
            <p><strong>Please stay tuned for further updates!</strong> We'll be sending you important information about committee allocations, event schedules, and preparation materials in the coming weeks.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:mun@kct.ac.in">mun@kct.ac.in</a></p>
            
            <p>Best regards,<br>
            <strong>K-MUN 2025 Organizing Committee</strong><br>
            Kumaraguru College of Technology</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 Kumaraguru MUN. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: JSON.stringify(['firstName', 'lastName', 'registrationId', 'paymentAmount', 'institution', 'committeePreference1', 'committeePreference2', 'committeePreference3']),
    isActive: true
  },
  {
    name: 'payment_confirmation',
    subject: 'Payment Confirmation - K-MUN 2025',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation - K-MUN 2025</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #172d9d, #797dfa); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #172d9d; }
          .detail-value { color: #666; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
            <h2>Kumaraguru MUN 2025</h2>
          </div>
          
          <div class="content">
            <p>Dear {{firstName}} {{lastName}},</p>
            
            <p>Great news! Your payment has been successfully processed. Your registration for K-MUN 2025 is now complete.</p>
            
            <div class="details">
              <h3>💳 Payment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value">{{paymentId}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">₹{{amount}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{new Date().toLocaleDateString()}}</span>
              </div>
            </div>
            
            <h3>🎉 You're All Set!</h3>
            <p>Your registration is now complete. Here's what happens next:</p>
            <ul>
              <li>Committee allocations will be announced within 48 hours</li>
              <li>Background guides will be shared via email</li>
              <li>Event schedule and venue details will be provided</li>
              <li>Preparation materials and resources will be available</li>
            </ul>
            
            <p><strong>Please stay tuned for further updates!</strong> We'll be sending you important information about your committee assignment and event details soon.</p>
            
            <p>If you have any questions, please contact us at <a href="mailto:mun@kct.ac.in">mun@kct.ac.in</a></p>
            
            <p>Best regards,<br>
            <strong>K-MUN 2025 Organizing Committee</strong><br>
            Kumaraguru College of Technology</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 Kumaraguru MUN. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: JSON.stringify(['firstName', 'lastName', 'paymentId', 'amount']),
    isActive: true
  },
  {
    name: 'welcome_email',
    subject: 'Welcome to K-MUN 2025 - Your Account Details',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to K-MUN 2025</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #172d9d, #797dfa); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #172d9d; }
          .credential-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .credential-label { font-weight: bold; color: #172d9d; }
          .credential-value { color: #666; font-family: monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #172d9d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to K-MUN 2025!</h1>
            <h2>Kumaraguru Model United Nations</h2>
          </div>
          
          <div class="content">
            <p>Dear {{firstName}} {{lastName}},</p>
            
            <p>Welcome to Kumaraguru MUN 2025! Your account has been successfully created by our admin team. We're excited to have you join us for this incredible experience.</p>
            
            <div class="credentials">
              <h3>🔐 Your Login Credentials</h3>
              <div class="credential-row">
                <span class="credential-label">Email:</span>
                <span class="credential-value">{{email}}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">Password:</span>
                <span class="credential-value">{{password}}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">Role:</span>
                <span class="credential-value">{{role}}</span>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong><br>
              Please change your password immediately after your first login for security purposes. Keep your credentials safe and do not share them with anyone.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kmun.kct.ac.in/login" class="button">Login to Your Account</a>
            </div>
            
            <h3>📋 What's Next?</h3>
            <ul>
              <li>Login to your account using the credentials above</li>
              <li>Change your password for security</li>
              <li>Complete your profile information</li>
              <li>Explore the dashboard and available features</li>
              <li>Check for any pending tasks or notifications</li>
            </ul>
            
            <h3>🎯 Your Role: {{role}}</h3>
            <p>As a <strong>{{role}}</strong>, you have access to specific features and permissions within the K-MUN system. Please familiarize yourself with your role's capabilities and responsibilities.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:mun@kct.ac.in">mun@kct.ac.in</a></p>
            
            <p>Best regards,<br>
            <strong>K-MUN 2025 Organizing Committee</strong><br>
            Kumaraguru College of Technology</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 Kumaraguru MUN. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: JSON.stringify(['firstName', 'lastName', 'email', 'password', 'role']),
    isActive: true
  }
];

async function seedEmailTemplates() {
  try {
    console.log('🌱 Seeding email templates...');
    
    for (const template of emailTemplates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template,
      });
      console.log(`✅ Created/Updated template: ${template.name}`);
    }
    
    console.log('🎉 Email templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailTemplates();
