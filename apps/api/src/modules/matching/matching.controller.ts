import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchingService } from './matching.service';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  @ApiOperation({ summary: 'Get matches for current user' })
  async getMatches(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.matchingService.getMatchesForUser(req.user.sub, page, limit);
    return { success: true, data: result.matches, meta: { total: result.total } };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a match' })
  async confirmMatch(@Param('id') id: string) {
    await this.matchingService.confirmMatch(id);
    return { success: true, message: 'Match confirmed' };
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a match' })
  async dismissMatch(@Param('id') id: string) {
    await this.matchingService.dismissMatch(id);
    return { success: true, message: 'Match dismissed' };
  }

  @Post('run/:lostItemId')
  @ApiOperation({ summary: 'Run matching for a specific lost item' })
  async runMatching(@Param('lostItemId') lostItemId: string) {
    const matches = await this.matchingService.findMatchesForLostItem(lostItemId);
    return { success: true, data: matches, message: `Found ${matches.length} matches` };
  }
}
