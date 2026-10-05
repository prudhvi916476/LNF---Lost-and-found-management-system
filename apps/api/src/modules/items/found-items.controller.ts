import {
  Controller, Get, Post, Put, HttpException,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateFoundItemDto, UpdateFoundItemDto } from './dto/items.dto';

@ApiTags('found-items')
@Controller('found-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoundItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Report a found item' })
  async create(@Req() req: any, @Body() body: CreateFoundItemDto) {
    try {
      const item = await this.itemsService.createFoundItem(req.user.sub, body as any);
      return { success: true, data: item, message: 'Found item reported successfully' };
    } catch (e: any) {
      console.log('ERROR IS:', e);
      throw new HttpException("Failed: " + (e.message || e.toString()), 400);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all found items (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.itemsService.getAllFoundItems(page, limit, status);
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
  @ApiOperation({ summary: 'Get current user found items' })
  async getMyItems(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.itemsService.getUserFoundItems(req.user.sub, page, limit);
    return {
      success: true,
      data: result.items,
      meta: { total: result.total, page: page || 1, limit: limit || 10 },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get found item by ID' })
  async findOne(@Param('id') id: string) {
    const item = await this.itemsService.getFoundItemById(id);
    return { success: true, data: item };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a found item' })
  async update(@Param('id') id: string, @Req() req: any, @Body() body: UpdateFoundItemDto) {
    const item = await this.itemsService.updateFoundItem(id, req.user.sub, body as any);
    return { success: true, data: item };
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add images to a found item' })
  async addImages(@Param('id') id: string, @Body() body: { urls: string[] }) {
    const images = await this.itemsService.addItemImages(id, 'found', body.urls);
    return { success: true, data: images };
  }
}
