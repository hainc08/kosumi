import type { Customer } from '@/types'

export const seedCustomers: Customer[] = [
  {
    id: 'cust-1', code: 'KH001', name: 'Công ty CP Đầu tư Aeon Việt Nam', type: 'domestic', industry: 'Bán lẻ / Thương mại',
    taxCode: '0301234567', address: '30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM',
    website: 'aeon.com.vn', status: 'active',
    defaultValidityDays: 10, defaultDeliveryDays: 50, defaultPaymentTerms: '30-25-35-10',
    defaultWarrantyNote: 'Bảo hành 12 tháng kể từ ngày bàn giao.', defaultSpecialNote: null,
    notes: 'Khách hàng lớn, nhiều dự án thương mại.',
    createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-05T00:00:00Z',
    contacts: [
      { id: 'ct-1', customerId: 'cust-1', fullName: 'Nguyễn Thanh Tùng', title: 'Trưởng phòng Dự án', phone: '0903111222', email: 'tung.nt@aeon.com.vn', isPrimary: true, sortOrder: 0 },
      { id: 'ct-2', customerId: 'cust-1', fullName: 'Lê Thị Hoa', title: 'Kế toán trưởng', phone: '0903333444', email: 'hoa.lt@aeon.com.vn', isPrimary: false, sortOrder: 1 },
    ],
    primaryContact: { fullName: 'Nguyễn Thanh Tùng', phone: '0903111222', email: 'tung.nt@aeon.com.vn' },
    projectCount: 2, quoteCount: 3, totalContractValue: 1850000000,
  },
  {
    id: 'cust-2', code: 'KH002', name: 'Studio Kiến trúc Minh Anh', type: 'household', industry: 'Kiến trúc / Nội thất',
    taxCode: null, address: '125 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    website: null, status: 'active',
    defaultValidityDays: 7, defaultDeliveryDays: 30, defaultPaymentTerms: '50-50',
    defaultWarrantyNote: null, defaultSpecialNote: 'Yêu cầu nghiệm thu theo từng hạng mục.',
    notes: null,
    createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z',
    contacts: [
      { id: 'ct-3', customerId: 'cust-2', fullName: 'Phạm Minh Anh', title: 'Kiến trúc sư trưởng', phone: '0987654321', email: 'minhanh@studio.vn', isPrimary: true, sortOrder: 0 },
    ],
    primaryContact: { fullName: 'Phạm Minh Anh', phone: '0987654321', email: 'minhanh@studio.vn' },
    projectCount: 1, quoteCount: 1, totalContractValue: 320000000,
  },
  {
    id: 'cust-3', code: 'KH003', name: 'Samsung Engineering Vietnam', type: 'foreign', industry: 'Kỹ thuật / Xây dựng công nghiệp',
    taxCode: '0108889999', address: 'KCN Yên Phong, Bắc Ninh',
    website: 'samsung.com', status: 'pending',
    defaultValidityDays: 14, defaultDeliveryDays: 60, defaultPaymentTerms: '30-70',
    defaultWarrantyNote: 'Warranty 24 months.', defaultSpecialNote: 'Hồ sơ song ngữ Việt–Anh.',
    notes: 'Đang chờ phản hồi báo giá gói thầu kết cấu thép.',
    createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-05-12T00:00:00Z',
    contacts: [
      { id: 'ct-4', customerId: 'cust-3', fullName: 'Kim Min Jae', title: 'Procurement Manager', phone: '0901555666', email: 'mj.kim@samsung.com', isPrimary: true, sortOrder: 0 },
    ],
    primaryContact: { fullName: 'Kim Min Jae', phone: '0901555666', email: 'mj.kim@samsung.com' },
    projectCount: 0, quoteCount: 1, totalContractValue: 0,
  },
  {
    id: 'cust-4', code: 'KH004', name: 'Ban QLDA Đầu tư Xây dựng tỉnh Bắc Ninh', type: 'state', industry: 'Hạ tầng / Xây dựng công cộng',
    taxCode: '2300112233', address: 'Số 1 Lý Thái Tổ, TP. Bắc Ninh',
    website: null, status: 'inactive',
    defaultValidityDays: 15, defaultDeliveryDays: 90, defaultPaymentTerms: '100-prepay',
    defaultWarrantyNote: null, defaultSpecialNote: 'Thanh toán qua Kho bạc Nhà nước.',
    notes: 'Tạm ngừng hợp tác từ Q1/2026.',
    createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
    contacts: [
      { id: 'ct-5', customerId: 'cust-4', fullName: 'Trần Văn Bình', title: 'Phó Giám đốc', phone: '0912000111', email: null, isPrimary: true, sortOrder: 0 },
    ],
    primaryContact: { fullName: 'Trần Văn Bình', phone: '0912000111', email: null },
    projectCount: 1, quoteCount: 2, totalContractValue: 540000000,
  },
]
