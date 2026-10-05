import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  async findAll(@Query('page') page?: number) {
    const result = await this.orgsService.findAll(page);
    return { success: true, data: result.organizations, meta: { total: result.total } };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  async findBySlug(@Param('slug') slug: string) {
    const org = await this.orgsService.findBySlug(slug);
    return { success: true, data: org };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create organization (admin only)' })
  async create(@Body() body: any) {
    const org = await this.orgsService.create(body);
    return { success: true, data: org };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'org_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization' })
  async update(@Param('id') id: string, @Body() body: any) {
    const org = await this.orgsService.update(id, body);
    return { success: true, data: org };
  }
}
