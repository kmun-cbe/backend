import nodemailer from 'nodemailer';
import { prisma } from '../config/database.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"Kumaraguru MUN 2025" <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTemplateEmail(templateName, to, variables = {}) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { name: templateName, isActive: true },
      });

      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      let subject = template.subject;
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;

      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
        if (textContent) {
          textContent = textContent.replace(new RegExp(placeholder, 'g'), variables[key]);
        }
      });

      return await this.sendEmail({
        to,
        subject,
        html: htmlContent,
        text: textContent,
      });
    } catch (error) {
      console.error('Template email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRegistrationConfirmation(userEmail, userData) {
    return await this.sendTemplateEmail('registration_confirmation', userEmail, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      registrationId: userData.registrationId,
      paymentAmount: userData.paymentAmount,
    });
  }

  async sendPaymentConfirmation(userEmail, paymentData) {
    return await this.sendTemplateEmail('payment_confirmation', userEmail, {
      firstName: paymentData.firstName,
      lastName: paymentData.lastName,
      amount: paymentData.amount,
      paymentId: paymentData.paymentId,
      invoiceUrl: paymentData.invoiceUrl,
    });
  }

  async sendCommitteeAllocation(userEmail, allocationData) {
    return await this.sendTemplateEmail('committee_allocation', userEmail, {
      firstName: allocationData.firstName,
      lastName: allocationData.lastName,
      committee: allocationData.committee,
      portfolio: allocationData.portfolio,
    });
  }

  async sendBulkEmail(recipients, subject, content, targetAudience = 'ALL') {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        const result = await this.sendEmail({
          to: recipient.email,
          subject,
          html: content,
        });
        
        results.push({
          email: recipient.email,
          success: result.success,
          error: result.error,
        });
      }

      return {
        success: true,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Bulk email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();