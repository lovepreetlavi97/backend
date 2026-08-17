import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.001)
  @Type(() => Number)
  weightGrams?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  @IsOptional()
  metalId?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  })
  metalIds?: string[];

  @IsString()
  @IsOptional()
  priceRuleId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublished?: boolean;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  })
  images?: string[];
}
