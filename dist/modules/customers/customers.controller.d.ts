import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
export declare class CustomersController {
    private svc;
    constructor(svc: CustomersService);
    findAll(q: QueryCustomerDto): Promise<import("./customers.service").CustomerWithContacts[]>;
    findOne(id: string): Promise<import("./customers.service").CustomerWithContacts>;
    create(dto: CreateCustomerDto): Promise<import("./customers.service").CustomerWithContacts>;
    update(id: string, dto: UpdateCustomerDto): Promise<import("./customers.service").CustomerWithContacts>;
    remove(id: string): Promise<void>;
}
