import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BannerConfigDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class OccasionDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class PriceFilterDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class RecipientDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class UpdateGiftStoreConfigDto {
  @ValidateNested()
  @Type(() => BannerConfigDto)
  banner: BannerConfigDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OccasionDto)
  occasions: OccasionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceFilterDto)
  priceFilters: PriceFilterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}

export interface GiftStoreConfig {
  banner: BannerConfigDto;
  occasions: OccasionDto[];
  priceFilters: PriceFilterDto[];
  recipients: RecipientDto[];
}
