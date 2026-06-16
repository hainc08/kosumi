import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
export declare class QuotesController {
    private svc;
    constructor(svc: QuotesService);
    nextCode(): Promise<string>;
    findAll(q: QueryQuoteDto): Promise<import("./quotes.service").QuoteWithRelations[]>;
    findOne(id: string): Promise<import("./quotes.service").QuoteWithRelations>;
    create(dto: CreateQuoteDto): Promise<import("./quotes.service").QuoteWithRelations>;
    update(id: string, dto: UpdateQuoteDto): Promise<import("./quotes.service").QuoteWithRelations>;
    updateStatus(id: string, body: {
        status: string;
        rejectReason?: string;
    }): Promise<import("./quotes.service").QuoteWithRelations>;
    duplicate(id: string): Promise<import("./quotes.service").QuoteWithRelations>;
    remove(id: string): Promise<void>;
}
