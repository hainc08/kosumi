import { CreateQuoteItemDto } from './create-quote-item.dto';
import { CreateQuotePaymentStepDto } from './create-quote-payment-step.dto';
export declare class CreateQuoteDto {
    projectId?: string;
    customerId?: string;
    contactId?: string;
    newProjectName?: string;
    title: string;
    quoteDate: string;
    validUntil?: string;
    taxRate: number;
    validityDays: number;
    deliveryDays: number;
    paymentTerms: string;
    warrantyNote?: string;
    contractorNote?: string;
    notes?: string;
    items: CreateQuoteItemDto[];
    paymentSteps: CreateQuotePaymentStepDto[];
}
