import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QrService } from './qr.service';

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a QR tag for an item' })
  async createTag(@Req() req: any, @Body() body: { itemName: string; itemDescription?: string }) {
    const tag = await this.qrService.createTag(req.user.sub, body.itemName, body.itemDescription);
    return { success: true, data: tag };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my QR tags' })
  async getMyTags(@Req() req: any) {
    const tags = await this.qrService.getUserTags(req.user.sub);
    return { success: true, data: tags };
  }

  @Get('scan/:code')
  @ApiOperation({ summary: 'Scan a QR code (public)' })
  async scanTag(
    @Param('code') code: string,
    @Query('lat') latitude?: number,
    @Query('lng') longitude?: number,
  ) {
    const tag = await this.qrService.scanTag(code, latitude, longitude);
    return {
      success: true,
      data: {
        itemName: tag.itemName,
        itemDescription: tag.itemDescription,
        ownerName: (tag as any).user?.fullName,
        message: 'This item has been registered on FindIt. The owner has been notified.',
      },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a QR tag' })
  async deactivateTag(@Param('id') id: string, @Req() req: any) {
    await this.qrService.deactivateTag(id, req.user.sub);
    return { success: true, message: 'QR tag deactivated' };
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a QR tag' })
  async activateTag(@Param('id') id: string, @Req() req: any) {
    await this.qrService.activateTag(id, req.user.sub);
    return { success: true, message: 'QR tag activated' };
  }
}
