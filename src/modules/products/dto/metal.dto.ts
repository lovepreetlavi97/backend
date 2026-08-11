import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
