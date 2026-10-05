import { Controller, Get, Put, Body, Req, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return { success: true, data: user };
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(@Req() req: any, @Body() body: UpdateUserDto) {
    const user = await this.usersService.updateProfile(req.user.sub, body);
    return { success: true, data: user };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get reputation leaderboard' })
  async getLeaderboard(@Query('limit') limit?: number) {
    const users = await this.usersService.getLeaderboard(limit);
    return { success: true, data: users };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { success: true, data: user };
  }
}
