import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsEnum, IsArray, IsDateString, IsObject, MaxLength, ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateLostItemDto {
  @ApiProperty({ example: 'Black Samsung Galaxy S24' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 'Phone' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Samsung' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Galaxy S24' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ example: 'Lost my black Samsung phone near the library entrance' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  uniqueIdentifiers?: Record<string, string>;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lostDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostTimeApprox?: string;

  @ApiPropertyOptional({ enum: ['email', 'phone', 'in_app'] })
  @IsOptional()
  @IsEnum(['email', 'phone', 'in_app'])
  contactPreference?: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  rewardAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}

export class UpdateLostItemDto extends PartialType(CreateLostItemDto) {
  @ApiPropertyOptional({ enum: ['active', 'matched', 'recovered', 'closed'] })
  @IsOptional()
  @IsEnum(['active', 'matched', 'recovered', 'closed'])
  status?: string;
}

export class CreateFoundItemDto {
  @ApiProperty({ example: 'Black Samsung Phone' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 'Phone' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Found a black Samsung phone near the library' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Samsung' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  foundDate?: string;

  @ApiPropertyOptional({ enum: ['personal', 'authority', 'org_desk'] })
  @IsOptional()
  @IsEnum(['personal', 'authority', 'org_desk'])
  storage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  /**
   * Optional custom verification questions (0–5).
   * The finder can add questions that only the real owner would know.
   * e.g. "What sticker is on the back?"
   */
  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  customQuestions?: string[];
}

export class UpdateFoundItemDto extends PartialType(CreateFoundItemDto) {
  @ApiPropertyOptional({ enum: ['awaiting_match', 'matched', 'returned'] })
  @IsOptional()
  @IsEnum(['awaiting_match', 'matched', 'returned'])
  status?: string;
}
