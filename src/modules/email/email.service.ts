import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getEnvConfig } from '../../config/env.config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendOrderConfirmationEmail(order: any, email: string) {
    try {
      let baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
        baseUrl = 'https://gurujewellers.in';
      } else if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'staging') {
        baseUrl = 'https://staging.gurujewellers.in';
      }
      
      const trackingLink = `${baseUrl}/order/${order.orderNumber}?token=${order.magicToken}`;

      let itemsHtml = '';
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        const itemRows = await Promise.all(
          order.items.map(async (item: any) => {
            let product: any = item.product || {};
            
            if (!product.id && item.productId) {
               try {
                 const fetchedProduct = await this.prisma.product.findUnique({
                   where: { id: item.productId }
                 });
                 if (fetchedProduct) {
                   product = fetchedProduct;
                 }
               } catch (e) {
                 // ignore if not found
               }
            }

            const imageUrl = Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : 'https://via.placeholder.com/80?text=Jewellery';
            const title = product.title || product.name || item.title || 'Jewellery Item';
            const price = item.itemTotal || item.unitPrice * item.quantity || 0;

            return `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #EEE;">
                  <img src="${imageUrl}" alt="${title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #EEE; color: #1B1B1B;">
                  <strong>${title}</strong><br/>
                  <span style="color: #6E6E6E; font-size: 12px;">Qty: ${item.quantity}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: right; color: #1B1B1B;">
                  ₹${price}
                </td>
              </tr>
            `;
          })
        );
        itemsHtml = itemRows.join('');
      }

      const mailOptions = {
        from: `"Guru Jewellers" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E6DED2; border-radius: 10px; background-color: #FAF8F5;">
            <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #E6DED2;">
              <img src="https://gurujewellers.in/logo.png" alt="Guru Jewellers" style="max-width: 200px; height: auto;" onerror="this.outerHTML='<h1 style=\\'color: #C6A15B; letter-spacing: 2px;\\'>GURU JEWELLERS</h1>'"/>
            </div>
            
            <h2 style="color: #1B1B1B;">Thank you for your order!</h2>
            <p style="color: #555;">We have successfully received your order <strong>#${order.orderNumber}</strong>. We will notify you once it ships.</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1B1B1B; border-bottom: 1px solid #EEE; padding-bottom: 10px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>
              <div style="margin-top: 15px; padding-top: 15px; text-align: right;">
                ${order.shippingCharge ? `<p style="margin: 5px 0; color: #555;"><strong>Shipping:</strong> ₹${order.shippingCharge}</p>` : ''}
                ${order.discountAmount ? `<p style="margin: 5px 0; color: #10B981;"><strong>Discount:</strong> -₹${order.discountAmount}</p>` : ''}
                <p style="margin: 5px 0; font-size: 16px; color: #1B1B1B;"><strong>Total: ₹${order.finalAmount}</strong></p>
                ${order.pendingAmount && order.pendingAmount > 0 ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #DDD;">
                    <p style="margin: 5px 0; color: #10B981;"><strong>Amount Paid: ₹${order.amountPaid}</strong></p>
                    <p style="margin: 5px 0; font-size: 18px; color: #E11D48;"><strong>Pending (Due on Delivery): ₹${order.pendingAmount}</strong></p>
                  </div>
                ` : `
                  <p style="margin: 5px 0; font-size: 16px; color: #10B981;"><strong>Amount Paid: ₹${order.finalAmount}</strong></p>
                `}
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0 20px;">
              <a href="${trackingLink}" style="background-color: #1B1B1B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; letter-spacing: 1.5px; font-size: 14px;">TRACK YOUR ORDER</a>
            </div>

            <p style="color: #6E6E6E; font-size: 12px; text-align: center; margin-top: 30px;">Need help? Reply to this email or contact support@gurujewellers.in</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Order confirmation email sent to ${email} (Message ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
    }
  }
}
