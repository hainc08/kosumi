import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateCustomerContactDto {
  @IsString() @IsNotEmpty() fullName: string
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() phone?: string
  // Lenient: dữ liệu prototype có thể chứa email rỗng/không chuẩn → chỉ kiểm tra string.
  @IsOptional() @IsString() email?: string
  // isPrimary/sortOrder: service tự gán theo "primary rule" (contact đầu = primary), giá trị client gửi bị bỏ qua.
  @IsOptional() @IsBoolean() isPrimary?: boolean
  @IsOptional() @IsInt() sortOrder?: number
}
