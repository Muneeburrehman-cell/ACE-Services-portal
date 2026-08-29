import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProjectsService } from './projects.service';
import { RfisService } from './rfis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { UpdateProjectStatusDto, UpdateMerchantFeeDto } from './dto/update-status.dto';
import { CreateRfiDto, AnswerRfiDto } from './dto/create-rfi.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private projects: ProjectsService,
    private rfis: RfisService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.BD_AGENT, UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projects.create(dto, req.user.sub);
  }

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAsAdmin(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projects.createAsAdmin(dto, req.user.sub);
  }

  @Get('export/weekly-excel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async exportWeeklyExcel(
    @Query() query: any,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.projects.exportWeeklyExcel(query, req.user.sub);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.projects.findAll(req.user, query);
  }

  @Get('by-client/:clientCompanyName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getProjectsByClient(@Param('clientCompanyName') clientCompanyName: string, @Req() req: any) {
    return this.projects.findByClient(clientCompanyName);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projects.findOne(id, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
    @Req() req: any,
  ) {
    return this.projects.updateStatus(id, dto, req.user);
  }

  @Patch(':id/merchant-fee')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateMerchantFee(
    @Param('id') id: string,
    @Body() dto: UpdateMerchantFeeDto,
    @Req() req: any,
  ) {
    return this.projects.updateMerchantFee(id, dto, req.user.sub);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  assign(@Param('id') id: string, @Body() dto: AssignProjectDto, @Req() req: any) {
    return this.projects.assign(id, dto, req.user.sub);
  }

  @Patch(':id/reassign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  reassign(@Param('id') id: string, @Body() dto: AssignProjectDto, @Req() req: any) {
    return this.projects.assign(id, dto, req.user.sub);
  }

  @Patch(':id/status-in-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ESTIMATION_ENGINEER, UserRole.DESIGN_ENGINEER)
  markInProgress(@Param('id') id: string, @Req() req: any) {
    return this.projects.markInProgress(id, req.user.sub);
  }

  @Patch(':id/mark-delivered')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ESTIMATION_ENGINEER, UserRole.DESIGN_ENGINEER)
  markDelivered(@Param('id') id: string, @Req() req: any) {
    return this.projects.markDelivered(id, req.user.sub);
  }

  @Delete(':id/files/:fileId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    return this.projects.deleteFile(id, fileId, req.user);
  }

  // ── RFI Endpoints ──────────────────────────────────────────────────────────
  @Post(':id/rfis')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ESTIMATION_ENGINEER, UserRole.DESIGN_ENGINEER)
  createRfi(
    @Param('id') projectId: string,
    @Body() dto: CreateRfiDto,
    @Req() req: any,
  ) {
    return this.rfis.create(projectId, dto, req.user.sub);
  }

  @Get(':id/rfis')
  findRfis(@Param('id') projectId: string) {
    return this.rfis.findByProject(projectId);
  }

  @Patch(':id/rfis/:rfiId/answer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  answerRfi(
    @Param('id') projectId: string,
    @Param('rfiId') rfiId: string,
    @Body() dto: AnswerRfiDto,
    @Req() req: any,
  ) {
    return this.rfis.answerRfi(projectId, rfiId, dto, req.user.sub);
  }

  @Post(':id/rfis/:rfiId/forward-client')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  forwardRfiToClient(
    @Param('id') projectId: string,
    @Param('rfiId') rfiId: string,
    @Req() req: any,
  ) {
    return this.rfis.forwardToClient(projectId, rfiId, req.user.sub);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string, @Req() req: any) {
    return this.projects.getStatusHistory(id, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteProject(@Param('id') id: string, @Req() req: any) {
    return this.projects.delete(id, req.user.sub);
  }
}
