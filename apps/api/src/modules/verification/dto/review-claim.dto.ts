import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewClaimDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'info_requested'] })
  @IsEnum(['approved', 'rejected', 'info_requested'])
  status: string;

  @ApiPropertyOptional({ example: 'The answers match our records. Approved.' })
  @IsOptional()
  @IsString()
  finderResponse?: string;
}

export class AdminOverrideDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'suspended'] })
  @IsEnum(['approved', 'rejected', 'suspended'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminOverride?: string;
}
