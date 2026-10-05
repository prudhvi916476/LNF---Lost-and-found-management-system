import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReputationService } from './reputation.service';

@ApiTags('reputation')
@Controller('reputation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('badges')
  @ApiOperation({ summary: 'Get my badges' })
  async getMyBadges(@Req() req: any) {
    const badges = await this.reputationService.getUserBadges(req.user.sub);
    return { success: true, data: badges };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard(@Query('limit') limit?: number, @Query('organizationId') orgId?: string) {
    const leaderboard = await this.reputationService.getLeaderboard(limit, orgId);
    return { success: true, data: leaderboard };
  }
}
