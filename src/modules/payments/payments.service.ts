import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { getEnvConfig } from '../../config/env.config';

@Injectable()
export class PaymentsService {
  private readonly razorpaySecret: string;
  private readonly razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    const config = getEnvConfig();
    this.razorpaySecret = config.razorpayKeySecret;
    this.razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
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
    orderId: string | undefined,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const isValid = this.verifySignature(razorpayOrderId, razorpayPaymentId, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature verification failed.');
    }

    let existingOrder = null;
    if (orderId) {
      existingOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { transactions: true },
      });
    } else if (razorpayOrderId) {
      existingOrder = await this.prisma.order.findFirst({
        where: { razorpayOrderId },
        include: { transactions: true },
      });
    }

    if (existingOrder) {
      if (existingOrder.paymentStatus === 'PAID') {
        return {
          message: 'Payment already processed successfully (Idempotent call).',
          order: existingOrder,
          transaction: existingOrder.transactions[0] || null,
        };
      }

      return this.prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: existingOrder.id },
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

    // Try finding the pending kitty payment mapping in Redis
    const kittyPaymentData = await this.redis.get<{ userKittyId: string; installmentIndex: number }>(
      `pending-kitty-payment:${razorpayOrderId}`,
    );

    if (!kittyPaymentData) {
      throw new NotFoundException(
        `Payment association not found for Razorpay Order ID '${razorpayOrderId}'.`,
      );
    }

    const { userKittyId, installmentIndex } = kittyPaymentData;

    const userKitty = await this.prisma.userKitty.findUnique({
      where: { id: userKittyId },
      include: { plan: true },
    });

    if (!userKitty) {
      throw new NotFoundException(`User Kitty subscription '${userKittyId}' not found.`);
    }

    if (userKitty.paidMonths > installmentIndex) {
      return {
        message: 'Installment payment already processed successfully (Idempotent call).',
        userKitty,
      };
    }

    const monthlyAmount = Number(userKitty.plan.monthlyAmount);

    return this.prisma.$transaction(async (tx) => {
      const newPaidMonths = userKitty.paidMonths + 1;
      const totalMonths = userKitty.plan.totalMonths;
      const isCompleted = newPaidMonths >= totalMonths;
      const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';

      const currentDueDate = new Date(userKitty.nextDueDate);
      const nextDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + 1));

      const updatedKitty = await tx.userKitty.update({
        where: { id: userKittyId },
        data: {
          paidMonths: newPaidMonths,
          totalAccumulated: { increment: monthlyAmount },
          status: newStatus,
          nextDueDate: nextDueDate,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          paymentId: razorpayPaymentId,
          amount: monthlyAmount,
          currency: 'INR',
          status: 'PAID',
          gatewayResponse: {
            razorpayOrderId,
            razorpayPaymentId,
            signature,
            userKittyId,
            installmentIndex,
          },
        },
      });

      await this.redis.del(`pending-kitty-payment:${razorpayOrderId}`);

      return { userKitty: updatedKitty, transaction };
    });
  }

  async createRazorpayOrder(amount: number, orderId: string) {
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { razorpayOrderId: order.id },
      });

      return {
        order,
      };
    } catch (error: any) {
      throw new BadRequestException(`Razorpay order creation failed: ${error.message}`);
    }
  }
}
