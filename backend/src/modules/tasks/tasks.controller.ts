import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { TasksService } from './tasks.service'
import { AssignWorkerDto } from './dto/assign-worker.dto'
import { TransferWorkerDto } from './dto/transfer-worker.dto'

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private svc: TasksService) {}

  // Khai báo các route tĩnh TRƯỚC ':id' để tránh bị bắt nhầm làm :id
  @Get('active') activeTasks() { return this.svc.activeTasksAll() }

  @Get('available-workers') availableWorkers(@Query('siteId') siteId?: string) {
    return this.svc.availableWorkers(siteId)
  }

  @Get() tasksForQuote(@Query('quoteId') quoteId: string) { return this.svc.tasksForQuote(quoteId) }

  @Post('transfer') transfer(@Body() dto: TransferWorkerDto) {
    return this.svc.transfer(dto.workerId, dto.fromTaskId, dto.toTaskId)
  }

  @Post('assignments/bulk') saveAssignments(@Body() draft: Record<string, string[]>) {
    return this.svc.saveAssignments(draft)
  }

  @Post(':id/assign') assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkerDto) {
    return this.svc.assign(id, dto.workerId)
  }

  @Post(':id/unassign') unassign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkerDto) {
    return this.svc.unassign(id, dto.workerId)
  }
}
