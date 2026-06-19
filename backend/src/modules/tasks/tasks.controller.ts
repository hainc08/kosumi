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

  // Danh sách hạng mục đã hoàn thành (ai làm / tổng giờ / OT).
  @Get('completed') completed() { return this.svc.completedTasks() }

  // Tan ca thủ công: kết thúc các assignment ca thường đang active.
  @Post('clock-out') clockOut() { return this.svc.endOfShiftClockOut(new Date()) }

  // Lấy task theo dự án (projectId) hoặc theo báo giá (quoteId).
  @Get() tasks(@Query('quoteId') quoteId?: string, @Query('projectId') projectId?: string) {
    if (projectId) return this.svc.tasksForProject(projectId)
    return this.svc.tasksForQuote(quoteId)
  }

  // Sinh hạng mục công việc từ báo giá / từ toàn bộ báo giá của dự án.
  @Post('generate-from-quote') generateFromQuote(@Query('quoteId') quoteId: string) {
    return this.svc.generateFromQuote(quoteId)
  }

  @Post('generate-for-project') generateForProject(@Query('projectId') projectId: string) {
    return this.svc.generateForProject(projectId)
  }

  @Post('transfer') transfer(@Body() dto: TransferWorkerDto) {
    return this.svc.transfer(dto.workerId, dto.fromTaskId, dto.toTaskId)
  }

  @Post('assignments/bulk') saveAssignments(@Body() body: { draft: Record<string, string[]>; otHours?: number }) {
    return this.svc.saveAssignments(body.draft, body.otHours)
  }

  @Post(':id/assign') assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkerDto) {
    return this.svc.assign(id, dto.workerId, dto.otHours)
  }

  @Post(':id/unassign') unassign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkerDto) {
    return this.svc.unassign(id, dto.workerId)
  }

  @Post(':id/complete') complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.completeTask(id)
  }

  @Post(':id/cancel') cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.cancelTask(id)
  }
}
