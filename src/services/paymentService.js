import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/database.js';

class PaymentService {
  constructor() {
    // Check if Razorpay credentials are available
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      this.isConfigured = true;
    } else {
      console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
      this.isConfigured = false;
    }
  }

  async createOrder(amount, currency = 'INR', receipt, notes = {}) {
    try {
      if (!this.isConfigured) {
        return { 
          success: false, 
          error: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.' 
        };
      }

      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
        notes,
      };

      const order = await this.razorpay.orders.create(options);
      return { success: true, order };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      if (!this.isConfigured) {
        return { 
          success: false, 
          error: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.' 
        };
      }

      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpaySignature;
      return { success: true, isAuthentic };
    } catch (error) {
      console.error('Payment verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processRegistrationPayment(userId, registrationId, amount) {
    try {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          registrationId,
          amount,
          currency: 'INR',
          status: 'PENDING',
        },
      });

      // Create Razorpay order
      const orderResult = await this.createOrder(
        amount,
        'INR',
        `reg_${registrationId}`,
        {
          userId,
          registrationId,
          paymentId: payment.id,
        }
      );

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Update payment with Razorpay order ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: { razorpayOrderId: orderResult.order.id },
      });

      return {
        success: true,
        payment,
        razorpayOrder: orderResult.order,
      };
    } catch (error) {
      console.error('Registration payment processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  async confirmPayment(paymentId, razorpayPaymentId, razorpaySignature) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: true,
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment signature
      const verification = await this.verifyPayment(
        payment.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!verification.success || !verification.isAuthentic) {
        throw new Error('Payment verification failed');
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      // Update registration payment status
      if (payment.registrationId) {
        await prisma.registration.update({
          where: { id: payment.registrationId },
          data: { paymentStatus: 'PAID' },
        });
      }

      return { success: true, payment: updatedPayment };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async refundPayment(paymentId, amount, reason) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || payment.status !== 'PAID') {
        throw new Error('Payment not found or not eligible for refund');
      }

      const refund = await this.razorpay.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: amount * 100, // Amount in paise
          notes: { reason },
        }
      );

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });

      return { success: true, refund };
    } catch (error) {
      console.error('Payment refund failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return { success: true, payment };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PaymentService();