import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // ── Any authenticated user (static routes FIRST to avoid :id conflict) ────

  /** Update own display name and/or password */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() body: any, @Req() req: any) {
    return this.users.updateProfile(req.user.sub, body, req.user.sub);
  }

  // ── Admin-only endpoints ──────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('role') role?: UserRole,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.users.findAll(role, Number(page), Number(limit));
  }

  @Get('engineers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findEngineers(@Query('type') type?: 'estimation' | 'design') {
    return this.users.findEngineers(type);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.users.create(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.users.update(id, dto, req.user.sub);
  }

  @Delete(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.users.deactivate(id, req.user.sub);
  }

  /** Hard delete — admin only */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.users.delete(id, req.user.sub);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  resetPassword(@Param('id') id: string, @Req() req: any) {
    return this.users.triggerPasswordReset(id, req.user.sub);
  }
}

