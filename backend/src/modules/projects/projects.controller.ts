import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { QueryProjectDto } from './dto/query-project.dto'

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private svc: ProjectsService) {}
  @Get() findAll(@Query() q: QueryProjectDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateProjectDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) { return this.svc.update(id, dto) }
  @Patch(':id/status') setStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.svc.setStatus(id, status) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
