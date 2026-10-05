import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import { QrTag } from '../../database/entities/all-entities';

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(QrTag)
    private readonly qrRepo: Repository<QrTag>,
    private readonly configService: ConfigService,
  ) {}

  async createTag(userId: string, itemName: string, itemDescription?: string): Promise<QrTag> {
    const code = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const scanUrl = `${frontendUrl}/qr/${code}`;

    const qrImageDataUrl = await QRCode.toDataURL(scanUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    const tag = this.qrRepo.create({
      userId,
      code,
      itemName,
      itemDescription,
      qrImageUrl: qrImageDataUrl,
    });

    return this.qrRepo.save(tag);
  }

  async getUserTags(userId: string): Promise<QrTag[]> {
    return this.qrRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async scanTag(code: string, latitude?: number, longitude?: number): Promise<QrTag> {
    const tag = await this.qrRepo.findOne({
      where: { code },
      relations: ['user'],
    });
    if (!tag) throw new NotFoundException('QR tag not found');
    if (!tag.isActive) throw new NotFoundException('This QR tag has been deactivated');

    tag.lastScanned = new Date();
    if (latitude) tag.lastScanLat = latitude;
    if (longitude) tag.lastScanLng = longitude;
    await this.qrRepo.save(tag);

    return tag;
  }

  async deactivateTag(id: string, userId: string): Promise<void> {
    await this.qrRepo.update({ id, userId }, { isActive: false });
  }

  async activateTag(id: string, userId: string): Promise<void> {
    await this.qrRepo.update({ id, userId }, { isActive: true });
  }
}
