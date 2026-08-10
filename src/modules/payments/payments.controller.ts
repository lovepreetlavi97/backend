import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

export interface VerifyPaymentDto {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  signature?: string;
  // Support snake_case parameters sent by Razorpay handlers
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async createPaymentOrder(@Body() body: { amount: number; orderId: string }) {
    const result = await this.paymentsService.createRazorpayOrder(body.amount, body.orderId);
    return {
      status: 'success',
      ...result,
    };
  }

  @Post('verify')
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const razorpayOrderId = dto.razorpayOrderId || dto.razorpay_order_id;
    const razorpayPaymentId = dto.razorpayPaymentId || dto.razorpay_payment_id;
    const signature = dto.signature || dto.razorpay_signature;
    const orderId = dto.orderId;

    const result = await this.paymentsService.processPaymentVerification(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    );
    return {
      status: 'success',
      message: 'Payment verified successfully.',
      data: result,
    };
  }
}
