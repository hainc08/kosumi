export declare class Task {
    id: string;
    quoteItemId: string | null;
    projectId: string;
    siteId: string;
    title: string;
    description: string | null;
    taskDate: string;
    status: string;
    priority: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
