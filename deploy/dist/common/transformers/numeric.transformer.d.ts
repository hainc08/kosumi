import { ValueTransformer } from 'typeorm';
export declare class ColumnNumericTransformer implements ValueTransformer {
    to(v: number | null): number | null;
    from(v: string | null): number | null;
}
