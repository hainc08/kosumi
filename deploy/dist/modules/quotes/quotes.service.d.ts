import { DataSource, Repository } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { QuotePaymentStep } from './entities/quote-payment-step.entity';
import { Project } from '../projects/entities/project.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
export type QuoteWithRelations = Quote & {
    items: QuoteItem[];
    paymentSteps: QuotePaymentStep[];
    project?: {
        id: string;
        name: string;
    };
    customer?: {
        id: string;
        name: string;
    };
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    itemCount: number;
    sectionCount: number;
};
export declare class QuotesService {
    private repo;
    private itemRepo;
    private stepRepo;
    private projectRepo;
    private customerRepo;
    private dataSource;
    constructor(repo: Repository<Quote>, itemRepo: Repository<QuoteItem>, stepRepo: Repository<QuotePaymentStep>, projectRepo: Repository<Project>, customerRepo: Repository<Customer>, dataSource: DataSource);
    private enrich;
    private loadRelations;
    nextCode(): Promise<string>;
    findAll(q: QueryQuoteDto): Promise<QuoteWithRelations[]>;
    findOne(id: string): Promise<QuoteWithRelations>;
    private buildItemEntities;
    private buildStepEntities;
    create(dto: CreateQuoteDto): Promise<QuoteWithRelations>;
    update(id: string, dto: UpdateQuoteDto): Promise<QuoteWithRelations>;
    updateStatus(id: string, status: string, rejectReason?: string): Promise<QuoteWithRelations>;
    duplicate(id: string): Promise<QuoteWithRelations>;
    remove(id: string): Promise<void>;
}
