import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMetalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsString()
  @IsOptional()
  gradient?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  ratePerGram?: number;

  @IsString()
  @IsOptional()
  purity?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMetalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsString()
  @IsOptional()
  gradient?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  ratePerGram?: number;

  @IsString()
  @IsOptional()
  purity?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
