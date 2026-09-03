import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'role'>,
  ) {
    return this.incidentsService.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENGINEER)
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN, Role.ENGINEER)
  assign(@Param('id') id: string, @Body() dto: AssignIncidentDto) {
    return this.incidentsService.assign(id, dto);
  }

  @Post(':id/resolve')
  @Roles(Role.ADMIN, Role.ENGINEER)
  resolve(@Param('id') id: string) {
    return this.incidentsService.resolve(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'role'>,
  )
  {
    return this.incidentsService.addComment(id, user.id, dto);
  }

}