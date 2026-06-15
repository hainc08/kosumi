import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { WorkersService } from './workers.service'
import { CreateWorkerDto } from './dto/create-worker.dto'
import { UpdateWorkerDto } from './dto/update-worker.dto'
import { QueryWorkerDto } from './dto/query-worker.dto'

@Controller('workers')
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(private svc: WorkersService) {}
  @Get() findAll(@Query() q: QueryWorkerDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateWorkerDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkerDto) { return this.svc.update(id, dto) }
  @Patch(':id/status') setStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.svc.setStatus(id, status) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
