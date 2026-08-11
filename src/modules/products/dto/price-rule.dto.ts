import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePriceRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  makingChargeGram?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gstPercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercent?: number;
}

export class UpdatePriceRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  makingChargeGram?: number;
}
