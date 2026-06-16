export declare class Customer {
    id: string;
    code: string;
    name: string;
    type: string;
    taxCode: string | null;
    address: string | null;
    website: string | null;
    status: string;
    defaultValidityDays: number;
    defaultDeliveryDays: number;
    defaultPaymentTerms: string;
    defaultWarrantyNote: string | null;
    defaultSpecialNote: string | null;
    notes: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
