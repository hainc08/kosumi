export declare class Quote {
    id: string;
    code: string;
    projectId: string;
    customerId: string | null;
    contactId: string | null;
    title: string;
    quoteDate: string;
    validUntil: string | null;
    status: string;
    rejectReason: string | null;
    taxRate: number;
    validityDays: number;
    deliveryDays: number;
    paymentTerms: string;
    warrantyNote: string | null;
    contractorNote: string | null;
    notes: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
