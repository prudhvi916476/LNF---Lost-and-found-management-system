import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostItem, FoundItem, ItemImage, CustomVerificationQuestion } from '../../database/entities/all-entities';
import { LostItemsController } from './lost-items.controller';
import { FoundItemsController } from './found-items.controller';
import { ItemsService } from './items.service';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LostItem, FoundItem, ItemImage, CustomVerificationQuestion]),
    MatchingModule,
  ],
  controllers: [LostItemsController, FoundItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
