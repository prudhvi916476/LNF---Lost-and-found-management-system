import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FoundItemClaim,
  CustomVerificationQuestion,
  FoundItem,
  User,
  Notification,
} from '../../database/entities/all-entities';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FoundItemClaim,
      CustomVerificationQuestion,
      FoundItem,
      User,
      Notification,
    ]),
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
