import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Quote } from './entities/quote.entity'
import { QuoteItem } from './entities/quote-item.entity'
import { QuotePaymentStep } from './entities/quote-payment-step.entity'
import { Project } from '../projects/entities/project.entity'
import { Customer } from '../customers/entities/customer.entity'
import { QuotesService } from './quotes.service'
import { QuotesController } from './quotes.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteItem, QuotePaymentStep, Project, Customer])],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
