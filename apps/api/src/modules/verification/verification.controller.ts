import {
  Controller, Post, Get, Put, Delete,
  Body, Param, Req, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerificationService } from './verification.service';
import { SubmitClaimDto, AddCustomQuestionDto } from './dto/create-claim.dto';
import { ReviewClaimDto } from './dto/review-claim.dto';

@ApiTags('verification')
@Controller('verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // ─── Questions ───────────────────────────────────────────────

  @Get('questions/mandatory')
  @ApiOperation({ summary: 'Get the fixed mandatory ownership questions' })
  getMandatoryQuestions() {
    return { success: true, data: this.verificationService.getMandatoryQuestions() };
  }

  @Get('found/:foundItemId/questions')
  @ApiOperation({ summary: 'Get all questions (mandatory + custom) for a found item' })
  @ApiParam({ name: 'foundItemId' })
  async getAllQuestions(@Param('foundItemId') foundItemId: string) {
    const data = await this.verificationService.getAllQuestions(foundItemId);
    return { success: true, data };
  }

  @Post('found/:foundItemId/questions')
  @ApiOperation({ summary: 'Add a custom verification question (finder only, max 5)' })
  @ApiParam({ name: 'foundItemId' })
  async addCustomQuestion(
    @Param('foundItemId') foundItemId: string,
    @Req() req: any,
    @Body() body: AddCustomQuestionDto,
  ) {
    const q = await this.verificationService.addCustomQuestion(
      foundItemId,
      req.user.sub,
      body.questionText,
    );
    return { success: true, data: q };
  }

  @Delete('questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom question (finder only)' })
  async deleteCustomQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    await this.verificationService.deleteCustomQuestion(questionId, req.user.sub);
  }

  // ─── Claims ──────────────────────────────────────────────────

  @Post('found/:foundItemId/claim')
  @ApiOperation({ summary: 'Submit an ownership claim for a found item' })
  @ApiParam({ name: 'foundItemId' })
  async submitClaim(
    @Param('foundItemId') foundItemId: string,
    @Req() req: any,
    @Body() body: SubmitClaimDto,
  ) {
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const claim = await this.verificationService.submitClaim(
      foundItemId,
      req.user.sub,
      body.verificationAnswers,
      ipAddress,
      userAgent,
    );
    return {
      success: true,
      data: claim,
      message: 'Your claim has been submitted. The finder will review your answers.',
    };
  }

  @Get('found/:foundItemId/claims')
  @ApiOperation({ summary: 'Get all claims for a found item (finder only)' })
  @ApiParam({ name: 'foundItemId' })
  async getClaimsForFoundItem(
    @Param('foundItemId') foundItemId: string,
    @Req() req: any,
  ) {
    const claims = await this.verificationService.getClaimsForFoundItem(
      foundItemId,
      req.user.sub,
    );
    return { success: true, data: claims };
  }

  @Get('claims/my')
  @ApiOperation({ summary: 'Get all my submitted claims' })
  async getMyClaims(@Req() req: any) {
    const claims = await this.verificationService.getMyClaims(req.user.sub);
    return { success: true, data: claims };
  }

  @Get('claims/:claimId')
  @ApiOperation({ summary: 'Get a specific claim by ID' })
  async getClaimById(@Param('claimId') claimId: string, @Req() req: any) {
    const claim = await this.verificationService.getClaimById(claimId);
    // Only the finder or claimant can view
    if (claim.claimantId !== req.user.sub && claim.finderId !== req.user.sub) {
      return { success: false, message: 'Access denied' };
    }
    return { success: true, data: claim };
  }

  @Put('claims/:claimId/review')
  @ApiOperation({ summary: 'Approve, reject, or request more info (finder only)' })
  async reviewClaim(
    @Param('claimId') claimId: string,
    @Req() req: any,
    @Body() body: ReviewClaimDto,
  ) {
    const claim = await this.verificationService.reviewClaim(
      claimId,
      req.user.sub,
      body.status,
      body.finderResponse,
    );
    return { success: true, data: claim };
  }

  @Get('claims/:claimId/contact')
  @ApiOperation({ summary: 'Reveal contact info after claim approval' })
  async getRevealedContact(@Param('claimId') claimId: string, @Req() req: any) {
    const contact = await this.verificationService.getRevealedContact(claimId, req.user.sub);
    return { success: true, data: contact };
  }
}
