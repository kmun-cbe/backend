import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class HealthController {
  async checkDatabase(req, res) {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        success: true,
        status: 'connected',
        message: 'Database connection is healthy'
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Database connection failed'
      });
    }
  }

  async checkPaymentGateway(req, res) {
    try {
      // Simulate payment gateway check
      // In a real implementation, you would check your payment provider's API
      const isHealthy = Math.random() > 0.1; // 90% success rate for demo
      
      if (isHealthy) {
        res.json({
          success: true,
          status: 'active',
          message: 'Payment gateway is operational'
        });
      } else {
        res.status(503).json({
          success: false,
          status: 'error',
          message: 'Payment gateway is temporarily unavailable'
        });
      }
    } catch (error) {
      console.error('Payment gateway health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Payment gateway check failed'
      });
    }
  }

  async checkEmailService(req, res) {
    try {
      // Simulate email service check
      // In a real implementation, you would check your email provider's API
      const isHealthy = Math.random() > 0.05; // 95% success rate for demo
      
      if (isHealthy) {
        res.json({
          success: true,
          status: 'operational',
          message: 'Email service is operational'
        });
      } else {
        res.status(503).json({
          success: false,
          status: 'error',
          message: 'Email service is temporarily down'
        });
      }
    } catch (error) {
      console.error('Email service health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Email service check failed'
      });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const [dbHealth, paymentHealth, emailHealth] = await Promise.allSettled([
        this.checkDatabase(req, res),
        this.checkPaymentGateway(req, res),
        this.checkEmailService(req, res)
      ]);

      const overallHealth = {
        database: dbHealth.status === 'fulfilled' ? 'connected' : 'error',
        paymentGateway: paymentHealth.status === 'fulfilled' ? 'active' : 'error',
        emailService: emailHealth.status === 'fulfilled' ? 'operational' : 'error'
      };

      const allHealthy = Object.values(overallHealth).every(status => 
        status === 'connected' || status === 'active' || status === 'operational'
      );

      res.json({
        success: true,
        status: allHealthy ? 'healthy' : 'degraded',
        services: overallHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('System health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'System health check failed'
      });
    }
  }
}

export default new HealthController();
