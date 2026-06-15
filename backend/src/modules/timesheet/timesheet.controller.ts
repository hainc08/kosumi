import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { TimesheetService } from './timesheet.service'
import { QuerySummariesDto } from './dto/query-summaries.dto'
import { ApproveMonthDto } from './dto/approve-month.dto'

@Controller('timesheet')
@UseGuards(JwtAuthGuard)
export class TimesheetController {
  constructor(private svc: TimesheetService) {}

  @Get('months') months() { return this.svc.availableMonths() }

  @Get('summaries') summaries(@Query() q: QuerySummariesDto) { return this.svc.summaries(q) }

  @Get('entries') entries(@Query('workerId') workerId: string, @Query('yearMonth') yearMonth: string) {
    return this.svc.entriesFor(workerId, yearMonth)
  }

  @Post('approve') approve(@Body() dto: ApproveMonthDto) {
    return this.svc.approveMonth(dto.workerId, dto.yearMonth)
  }
}
