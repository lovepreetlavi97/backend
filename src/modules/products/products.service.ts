import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalculatedProductPrice {
  metalRatePerGram: number;
  weightGrams: number;
  baseMetalPrice: number;
  makingChargeGram: number;
  totalMakingCharge: number;
  priceBeforeTax: number;
  gstAmount: number;
  discountAmount: number;
  finalPrice: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates dynamic jewelry product price preserving exact business logic formula:
   * Total Price = (Weight * RatePerGram + MakingCharge) * (1 + GST%) - Discount
   */
  calculatePrice(
    weightGrams: number,
    ratePerGram: number,
    makingChargeGram: number,
    gstPercentage: number = 3.0,
    discountPercent: number = 0.0,
  ): CalculatedProductPrice {
    const baseMetalPrice = weightGrams * ratePerGram;
    const totalMakingCharge = weightGrams * makingChargeGram;
    const rawTotal = baseMetalPrice + totalMakingCharge;

    const gstAmount = (rawTotal * gstPercentage) / 100;
    const discountAmount = (rawTotal * discountPercent) / 100;
    const finalPrice = Math.round((rawTotal + gstAmount - discountAmount) * 100) / 100;

    return {
      metalRatePerGram: ratePerGram,
      weightGrams,
      baseMetalPrice,
      makingChargeGram,
      totalMakingCharge,
      priceBeforeTax: rawTotal,
      gstAmount,
      discountAmount,
      finalPrice,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        subcategory: true,
        metal: true,
        priceRule: true,
        reviews: true,
      },
    });

    if (!product || product.isDeleted || !product.isPublished) {
      throw new NotFoundException(`Product with slug '${slug}' not found.`);
    }

    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
    const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
    const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
    const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams),
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent,
    );

    return {
      ...product,
      calculatedPrice: priceBreakdown,
    };
  }
}
