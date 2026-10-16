import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, LostItem, FoundItem, ItemImage } from '../../database/entities/all-entities';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Match, LostItem, FoundItem, ItemImage])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
