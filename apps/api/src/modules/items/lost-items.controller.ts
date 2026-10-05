import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req, UseGuards, HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateLostItemDto, UpdateLostItemDto } from './dto/items.dto';

@ApiTags('lost-items')
@Controller('lost-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LostItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Report a lost item' })
  async create(@Req() req: any, @Body() body: CreateLostItemDto) {
    try {
      const item = await this.itemsService.createLostItem(req.user.sub, body as any);
      return { success: true, data: item, message: 'Lost item reported successfully' };
    } catch (e: any) {
      console.log('ERROR IS:', e);
      throw new HttpException("Failed: " + (e.message || e.toString()), 400);
    }
  }

  @Post('test-create')
  async testCreate(@Body() body: any) {
    try {
      // Create a dummy user first or use an existing one
      const item = await this.itemsService.createLostItem('00000000-0000-0000-0000-000000000000', body);
      return { success: true, data: item };
    } catch (e: any) {
      return { success: false, error: e.message, stack: e.stack };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all lost items (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.itemsService.getAllLostItems(page, limit, status);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: page || 1,
        limit: limit || 20,
        totalPages: Math.ceil(result.total / (limit || 20)),
      },
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user lost items' })
  async getMyItems(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.itemsService.getUserLostItems(req.user.sub, page, limit);
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: page || 1, limit: limit || 10 },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lost item by ID' })
  async findOne(@Param('id') id: string) {
    const item = await this.itemsService.getLostItemById(id);
    return { success: true, data: item };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lost item' })
  async update(@Param('id') id: string, @Req() req: any, @Body() body: UpdateLostItemDto) {
    const item = await this.itemsService.updateLostItem(id, req.user.sub, body as any);
    return { success: true, data: item };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lost item' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.itemsService.deleteLostItem(id, req.user.sub);
    return { success: true, message: 'Item deleted' };
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add images to a lost item' })
  async addImages(@Param('id') id: string, @Body() body: { urls: string[] }) {
    const images = await this.itemsService.addItemImages(id, 'lost', body.urls);
    return { success: true, data: images };
  }
}
