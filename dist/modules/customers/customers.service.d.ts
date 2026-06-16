import { DataSource, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
export type CustomerWithContacts = Customer & {
    contacts: CustomerContact[];
    primaryContact?: {
        fullName: string;
        phone: string | null;
        email: string | null;
    };
    projectCount: number;
    quoteCount: number;
    totalContractValue: number;
};
export declare class CustomersService {
    private repo;
    private contactRepo;
    private dataSource;
    constructor(repo: Repository<Customer>, contactRepo: Repository<CustomerContact>, dataSource: DataSource);
    private enrich;
    findAll(q: QueryCustomerDto): Promise<CustomerWithContacts[]>;
    findOne(id: string): Promise<CustomerWithContacts>;
    private buildContactEntities;
    create(dto: CreateCustomerDto): Promise<CustomerWithContacts>;
    update(id: string, dto: UpdateCustomerDto): Promise<CustomerWithContacts>;
    remove(id: string): Promise<void>;
}
