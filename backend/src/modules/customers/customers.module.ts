import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Customer } from './entities/customer.entity'
import { CustomerContact } from './entities/customer-contact.entity'
import { CustomersService } from './customers.service'
import { CustomersController } from './customers.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Customer, CustomerContact])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
