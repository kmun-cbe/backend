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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #172d9d 0%, #797dfa 100%); color: white; padding: 40px 30px; text-align: center; position: relative; }
          .logo { width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #172d9d; }
          .content { padding: 40px 30px; }
          .details { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #172d9d; }
          .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: 600; color: #172d9d; font-size: 14px; }
          .detail-value { color: #475569; font-weight: 500; font-family: 'Courier New', monospace; }
          .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; padding: 20px; background: #f1f5f9; }
          .button { display: inline-block; background: linear-gradient(135deg, #172d9d 0%, #797dfa 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: 600; box-shadow: 0 4px 15px rgba(23, 45, 157, 0.3); transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .highlight-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .next-steps { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .next-steps ul { margin: 10px 0; padding-left: 20px; }
          .next-steps li { margin: 8px 0; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">K-MUN</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎉 Registration Confirmed!</h1>
            <h2 style="margin: 10px 0 0; font-size: 18px; font-weight: 400; opacity: 0.9;">Kumaraguru Model United Nations 2025</h2>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 25px;">Dear <strong>{{firstName}} {{lastName}}</strong>,</p>
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Congratulations! Your registration for Kumaraguru MUN 2025 has been successfully submitted. We're excited to have you join us for this incredible experience.</p>
            
            <div class="details">
              <h3 style="margin: 0 0 20px; color: #172d9d; font-size: 20px; font-weight: 700;">📋 Registration Details</h3>
              <div class="detail-row">
                <span class="detail-label">Registration ID:</span>
                <span class="detail-value">{{registrationId}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User ID:</span>
                <span class="detail-value">{{userId}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">{{transactionId}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{firstName}} {{lastName}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{email}}</span>
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
            
            <div class="highlight-box">
              <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 18px;">🔐 Account Created Successfully</h3>
              <p style="margin: 0; color: #1e40af; font-weight: 500;">Your delegate account has been automatically created with the email address you provided. A separate welcome email with your login credentials has been sent to your inbox.</p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://mun.kumaraguru.in/login" class="button">Access Your Dashboard</a>
            </div>
            
            <div class="next-steps">
              <h3 style="margin: 0 0 15px; color: #92400e; font-size: 18px;">📅 What's Next?</h3>
              <ul>
                <li>Check your email for login credentials (separate email sent)</li>
                <li>Login to your dashboard to complete your profile</li>
                <li>Complete your payment to secure your spot</li>
                <li>Committee allocations will be announced soon</li>
                <li>Background guides and preparation materials will be shared</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #475569; margin: 25px 0;"><strong>Please stay tuned for further updates!</strong> We'll be sending you important information about committee allocations, event schedules, and preparation materials in the coming weeks.</p>
            
            <p style="font-size: 16px; color: #475569; margin: 25px 0;">If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:mun@kct.ac.in" style="color: #172d9d; text-decoration: none; font-weight: 600;">mun@kct.ac.in</a></p>
            
            <p style="font-size: 16px; margin: 25px 0;">Best regards,<br>
            <strong style="color: #172d9d;">K-MUN 2025 Organizing Committee</strong><br>
            Kumaraguru College of Technology</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
            <p style="margin: 5px 0 0;">© 2025 Kumaraguru MUN. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: JSON.stringify(['firstName', 'lastName', 'registrationId', 'userId', 'transactionId', 'email', 'paymentAmount', 'institution', 'committeePreference1', 'committeePreference2', 'committeePreference3']),
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
              <a href="https://mun.kumaraguru.in/login" class="button">Login to Your Account</a>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #172d9d; font-weight: bold;">🔗 Direct Login Link:</p>
              <p style="margin: 5px 0; font-family: monospace; word-break: break-all;">
                <a href="https://mun.kumaraguru.in/login" style="color: #172d9d; text-decoration: none;">https://mun.kumaraguru.in/login</a>
              </p>
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
