import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { QuotesService } from './quotes.service'
import { CreateQuoteDto } from './dto/create-quote.dto'
import { UpdateQuoteDto } from './dto/update-quote.dto'
import { QueryQuoteDto } from './dto/query-quote.dto'

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private svc: QuotesService) {}

  // Phải khai báo TRƯỚC @Get(':id') để 'next-code' không bị bắt làm :id
  @Get('next-code') nextCode() { return this.svc.nextCode() }

  @Get() findAll(@Query() q: QueryQuoteDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateQuoteDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuoteDto) { return this.svc.update(id, dto) }
  @Patch(':id/status') updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; rejectReason?: string },
  ) {
    return this.svc.updateStatus(id, body.status, body.rejectReason)
  }
  @Post(':id/duplicate') duplicate(@Param('id', ParseUUIDPipe) id: string) { return this.svc.duplicate(id) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
