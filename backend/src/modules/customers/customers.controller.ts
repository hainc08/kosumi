import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { QueryCustomerDto } from './dto/query-customer.dto'

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private svc: CustomersService) {}
  @Get() findAll(@Query() q: QueryCustomerDto) { return this.svc.findAll(q) }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id) }
  @Post() create(@Body() dto: CreateCustomerDto) { return this.svc.create(dto) }
  @Put(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) { return this.svc.update(id, dto) }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id) }
}
