import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  async getUsers(@Query('page') page?: number, @Query('search') search?: string) {
    const result = await this.adminService.getAllUsers(page, 20, search);
    return { success: true, data: result.users, meta: { total: result.total } };
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    await this.adminService.toggleUserStatus(id, body.isActive);
    return { success: true };
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    await this.adminService.updateUserRole(id, body.role);
    return { success: true };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
    return { success: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    const stats = await this.adminService.getPlatformStats();
    return { success: true, data: stats };
  }
}
