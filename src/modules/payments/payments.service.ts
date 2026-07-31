import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { transactions: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    // Payment Idempotency Check
    if (existingOrder.paymentStatus === 'PAID') {
      return {
        message: 'Payment already processed successfully (Idempotent call).',
        order: existingOrder,
        transaction: existingOrder.transactions[0] || null,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          razorpayOrderId,
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
