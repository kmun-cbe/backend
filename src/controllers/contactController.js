import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ContactController {
  // Submit a new contact form
  async submitContact(req, res) {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, subject, and message are required'
        });
      }

      // Create contact submission
      const contact = await prisma.contact.create({
        data: {
          name,
          email,
          phone: phone || null,
          subject,
          message,
          status: 'pending',
          submittedAt: new Date()
        }
      });

      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: contact
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all contact submissions (for admin dashboards)
  async getAllContacts(req, res) {
    try {
      const contacts = await prisma.contact.findMany({
        orderBy: {
          submittedAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: contacts
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get contact by ID
  async getContactById(req, res) {
    try {
      const { id } = req.params;
      const contact = await prisma.contact.findUnique({
        where: { id: parseInt(id) }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update contact status (mark as resolved, etc.)
  async updateContact(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const contact = await prisma.contact.update({
        where: { id: parseInt(id) },
        data: {
          status: status || undefined,
          notes: notes || undefined,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: contact
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete contact
  async deleteContact(req, res) {
    try {
      const { id } = req.params;
      await prisma.contact.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get contact statistics for dashboard
  async getContactStats(req, res) {
    try {
      const totalContacts = await prisma.contact.count();
      const pendingContacts = await prisma.contact.count({
        where: { status: 'pending' }
      });
      const resolvedContacts = await prisma.contact.count({
        where: { status: 'resolved' }
      });

      res.json({
        success: true,
        data: {
          total: totalContacts,
          pending: pendingContacts,
          resolved: resolvedContacts
        }
      });
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new ContactController();
