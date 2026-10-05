import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrTag } from '../../database/entities/all-entities';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [TypeOrmModule.forFeature([QrTag])],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
