import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClaimsService } from './claims.service';

@ApiTags('claims')
@Controller('claims')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a claim for a lost item' })
  async create(@Req() req: any, @Body() body: any) {
    const claim = await this.claimsService.createClaim({ ...body, claimantId: req.user.sub });
    return { success: true, data: claim };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my claims' })
  async getMyClaims(@Req() req: any, @Query('page') page?: number) {
    const result = await this.claimsService.getUserClaims(req.user.sub, page);
    return { success: true, data: result.claims, meta: { total: result.total } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get claim details' })
  async getOne(@Param('id') id: string) {
    const claim = await this.claimsService.getClaimById(id);
    return { success: true, data: claim };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update claim status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; reviewNotes?: string }, @Req() req: any) {
    const claim = await this.claimsService.updateClaimStatus(id, body.status, req.user.sub, body.reviewNotes);
    return { success: true, data: claim };
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Add evidence to a claim' })
  async addEvidence(@Param('id') id: string, @Body() body: { type: string; fileUrl: string; description?: string }) {
    const evidence = await this.claimsService.addEvidence(id, body.type, body.fileUrl, body.description);
    return { success: true, data: evidence };
  }
}
