import {
  IsString, IsNotEmpty, IsObject, IsOptional,
  IsEnum, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitClaimDto {
  /**
   * Map of question ID -> answer string.
   * Mandatory question IDs: location, time, description, features, contents,
   *   ownership_proof, last_usage, additional_details
   * Custom question IDs: the UUID of the CustomVerificationQuestion
   */
  @ApiProperty({
    description: 'Map of questionId to answer text',
    example: {
      location: 'Main library entrance, 2nd floor',
      time: 'Around 3pm on Monday',
      description: 'Black leather wallet with gold clasp',
    },
  })
  @IsObject()
  @IsNotEmpty()
  verificationAnswers: Record<string, string>;
}

export class AddCustomQuestionDto {
  @ApiProperty({ example: 'What sticker is on the back of the item?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  questionText: string;
}
