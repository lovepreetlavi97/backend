import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getEnvConfig } from '../../config/env.config';

@Injectable()
export class PaymentsService {
  private readonly razorpaySecret: string;

  constructor(private readonly prisma: PrismaService) {
    const config = getEnvConfig();
    this.razorpaySecret = config.razorpayKeySecret;
  }

  /**
   * Verifies Razorpay HMAC SHA256 payment signature preserving exact security contract:
   * signature = HMAC-SHA256(order_id + '|' + payment_id, secret)
   */
  verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpaySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  async processPaymentVerification(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const isValid = this.verifySignature(razorpayOrderId, razorpayPaymentId, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature verification failed.');
    }

    // Atomic transaction updating Order status and creating Transaction audit log
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          paymentId: razorpayPaymentId,
          amount: order.finalAmount,
          currency: 'INR',
          status: 'PAID',
          gatewayResponse: { razorpayOrderId, razorpayPaymentId, signature },
        },
      });

      return { order, transaction };
    });
  }
}
