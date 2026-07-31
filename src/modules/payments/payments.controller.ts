import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

export interface VerifyPaymentDto {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const result = await this.paymentsService.processPaymentVerification(
      dto.orderId,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.signature,
    );
    return {
      status: 'success',
      message: 'Payment verified and order status updated to PAID.',
      data: result,
    };
  }
}
