import { ValueTransformer } from 'typeorm'
export class ColumnNumericTransformer implements ValueTransformer {
  to(v: number | null): number | null { return v }
  from(v: string | null): number | null { return v === null ? null : Number(v) }
}
