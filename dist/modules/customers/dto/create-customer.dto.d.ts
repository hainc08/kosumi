import { CreateCustomerContactDto } from './create-customer-contact.dto';
export declare class CreateCustomerDto {
    name: string;
    type: string;
    industry?: string;
    taxCode?: string;
    address?: string;
    website?: string;
    status?: string;
    defaultValidityDays?: number;
    defaultDeliveryDays?: number;
    defaultPaymentTerms?: string;
    defaultWarrantyNote?: string;
    defaultSpecialNote?: string;
    notes?: string;
    contacts?: CreateCustomerContactDto[];
}
