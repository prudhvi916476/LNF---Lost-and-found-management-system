import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  // @Roles('org_admin', 'super_admin')
  @ApiOperation({ summary: 'Get platform overview statistics' })
  async getOverview() {
    const data = await this.analyticsService.getOverview();
    return { success: true, data };
  }

  @Get('categories')
  // @Roles('org_admin', 'super_admin')
  @ApiOperation({ summary: 'Get category breakdown' })
  async getCategoryBreakdown() {
    const data = await this.analyticsService.getCategoryBreakdown();
    return { success: true, data };
  }

  @Get('timeseries')
  // @Roles('org_admin', 'super_admin')
  @ApiOperation({ summary: 'Get time series data' })
  async getTimeSeries(@Query('days') days?: number) {
    const data = await this.analyticsService.getTimeSeriesData(days);
    return { success: true, data };
  }

  @Get('heatmap')
  // @Roles('org_admin', 'super_admin')
  @ApiOperation({ summary: 'Get location heatmap data' })
  async getHeatmap() {
    const data = await this.analyticsService.getLocationHeatmap();
    return { success: true, data };
  }

  @Get('top-contributors')
  // @Roles('org_admin', 'super_admin')
  @ApiOperation({ summary: 'Get top contributors' })
  async getTopContributors(@Query('limit') limit?: number) {
    const data = await this.analyticsService.getTopContributors(limit);
    return { success: true, data };
  }
}
