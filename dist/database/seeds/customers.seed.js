"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCustomers = seedCustomers;
const customer_entity_1 = require("../../modules/customers/entities/customer.entity");
const customer_contact_entity_1 = require("../../modules/customers/entities/customer-contact.entity");
const code_util_1 = require("../../common/utils/code.util");
async function seedCustomers(ds) {
    const repo = ds.getRepository(customer_entity_1.Customer);
    const contactRepo = ds.getRepository(customer_contact_entity_1.CustomerContact);
    if (await repo.count({ withDeleted: true }) > 0)
        return;
    const data = [
        {
            customer: {
                name: 'Công ty CP Đầu tư Aeon Việt Nam', type: 'business',
                taxCode: '0301234567', address: '30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM',
                website: 'aeon.com.vn', status: 'active',
                defaultValidityDays: 10, defaultDeliveryDays: 50, defaultPaymentTerms: '30-25-35-10',
                defaultWarrantyNote: 'Bảo hành 12 tháng kể từ ngày bàn giao.', defaultSpecialNote: null,
                notes: 'Khách hàng lớn, nhiều dự án thương mại.',
            },
            contacts: [
                { fullName: 'Nguyễn Thanh Tùng', title: 'Trưởng phòng Dự án', phone: '0903111222', email: 'tung.nt@aeon.com.vn', isPrimary: true, sortOrder: 0 },
                { fullName: 'Lê Thị Hoa', title: 'Kế toán trưởng', phone: '0903333444', email: 'hoa.lt@aeon.com.vn', isPrimary: false, sortOrder: 1 },
            ],
        },
        {
            customer: {
                name: 'Studio Kiến trúc Minh Anh', type: 'studio',
                taxCode: null, address: '125 Nguyễn Trãi, Thanh Xuân, Hà Nội',
                website: null, status: 'active',
                defaultValidityDays: 7, defaultDeliveryDays: 30, defaultPaymentTerms: '50-50',
                defaultWarrantyNote: null, defaultSpecialNote: 'Yêu cầu nghiệm thu theo từng hạng mục.',
                notes: null,
            },
            contacts: [
                { fullName: 'Phạm Minh Anh', title: 'Kiến trúc sư trưởng', phone: '0987654321', email: 'minhanh@studio.vn', isPrimary: true, sortOrder: 0 },
            ],
        },
        {
            customer: {
                name: 'Samsung Engineering Vietnam', type: 'foreign',
                taxCode: '0108889999', address: 'KCN Yên Phong, Bắc Ninh',
                website: 'samsung.com', status: 'pending',
                defaultValidityDays: 14, defaultDeliveryDays: 60, defaultPaymentTerms: '30-70',
                defaultWarrantyNote: 'Warranty 24 months.', defaultSpecialNote: 'Hồ sơ song ngữ Việt–Anh.',
                notes: 'Đang chờ phản hồi báo giá gói thầu kết cấu thép.',
            },
            contacts: [
                { fullName: 'Kim Min Jae', title: 'Procurement Manager', phone: '0901555666', email: 'mj.kim@samsung.com', isPrimary: true, sortOrder: 0 },
            ],
        },
        {
            customer: {
                name: 'Ban QLDA Đầu tư Xây dựng tỉnh Bắc Ninh', type: 'state',
                taxCode: '2300112233', address: 'Số 1 Lý Thái Tổ, TP. Bắc Ninh',
                website: null, status: 'inactive',
                defaultValidityDays: 15, defaultDeliveryDays: 90, defaultPaymentTerms: '100-prepay',
                defaultWarrantyNote: null, defaultSpecialNote: 'Thanh toán qua Kho bạc Nhà nước.',
                notes: 'Tạm ngừng hợp tác từ Q1/2026.',
            },
            contacts: [
                { fullName: 'Trần Văn Bình', title: 'Phó Giám đốc', phone: '0912000111', email: null, isPrimary: true, sortOrder: 0 },
            ],
        },
    ];
    for (let i = 0; i < data.length; i++) {
        const { customer, contacts } = data[i];
        const saved = await repo.save(repo.create({ ...customer, code: (0, code_util_1.makeCode)('KH', i + 1) }));
        for (const contact of contacts) {
            await contactRepo.save(contactRepo.create({ ...contact, customerId: saved.id }));
        }
    }
}
//# sourceMappingURL=customers.seed.js.map