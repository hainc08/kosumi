import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SitesService } from './sites.service'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'
import { QuerySiteDto } from './dto/query-site.dto'

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private svc: SitesService) {}
  @Get() findAll(@Query() q: QuerySiteDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateSiteDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSiteDto) { return this.svc.update(id, dto) }
  @Patch(':id/status') setStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.svc.setStatus(id, status) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
