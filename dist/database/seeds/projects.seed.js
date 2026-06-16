"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProjects = seedProjects;
const project_entity_1 = require("../../modules/projects/entities/project.entity");
const site_entity_1 = require("../../modules/sites/entities/site.entity");
const customer_entity_1 = require("../../modules/customers/entities/customer.entity");
const code_util_1 = require("../../common/utils/code.util");
async function seedProjects(ds) {
    const repo = ds.getRepository(project_entity_1.Project);
    if (await repo.count({ withDeleted: true }) > 0)
        return;
    const siteRepo = ds.getRepository(site_entity_1.Site);
    const customerRepo = ds.getRepository(customer_entity_1.Customer);
    const sites = await siteRepo.find({ order: { code: 'ASC' } });
    const customers = await customerRepo.find({ order: { code: 'ASC' } });
    const customerByMock = {
        'cust-1': customers[0]?.id ?? null,
        'cust-2': customers[1]?.id ?? null,
        'cust-3': customers[2]?.id ?? null,
        'cust-4': customers[3]?.id ?? null,
    };
    const siteByMock = {
        'site-1': sites[0]?.id ?? null,
        'site-2': sites[1]?.id ?? null,
        'site-3': sites[2]?.id ?? null,
    };
    const data = [
        {
            name: 'Lan can & cầu thang thép Aeon Mall Bình Tân',
            customerId: customerByMock['cust-1'], projectType: 'commercial', siteId: siteByMock['site-3'],
            contractValue: 1250000000, startDate: '2026-04-01', deadline: '2026-06-25',
            actualEndDate: null, progressPct: 72, status: 'in_progress',
            description: 'Gia công và lắp đặt lan can kính, cầu thang thép khu trung tâm thương mại.',
            managerId: null,
        },
        {
            name: 'Nội thất căn hộ mẫu Vinhomes',
            customerId: customerByMock['cust-2'], projectType: 'apartment', siteId: siteByMock['site-2'],
            contractValue: 320000000, startDate: '2026-05-10', deadline: '2026-07-30',
            actualEndDate: null, progressPct: 35, status: 'in_progress',
            description: 'Thi công nội thất gỗ + kim loại căn hộ mẫu.',
            managerId: null,
        },
        {
            name: 'Kết cấu thép nhà xưởng Samsung Yên Phong',
            customerId: customerByMock['cust-3'], projectType: 'industrial', siteId: siteByMock['site-1'],
            contractValue: 4200000000, startDate: '2026-06-20', deadline: '2026-12-15',
            actualEndDate: null, progressPct: 0, status: 'planning',
            description: 'Gia công kết cấu thép nhà xưởng mở rộng.',
            managerId: null,
        },
        {
            name: 'Cổng & hàng rào nghệ thuật biệt thự',
            customerId: customerByMock['cust-2'], projectType: 'art', siteId: siteByMock['site-1'],
            contractValue: 180000000, startDate: '2026-03-01', deadline: '2026-04-20',
            actualEndDate: '2026-04-18', progressPct: 100, status: 'completed',
            description: 'Cổng sắt mỹ thuật + hàng rào trang trí.',
            managerId: null,
        },
        {
            name: 'Sửa chữa kết cấu trụ sở Bắc Ninh',
            customerId: customerByMock['cust-4'], projectType: 'other', siteId: siteByMock['site-1'],
            contractValue: 540000000, startDate: '2026-02-01', deadline: '2026-05-30',
            actualEndDate: null, progressPct: 60, status: 'paused',
            description: 'Tạm dừng chờ phê duyệt điều chỉnh.',
            managerId: null,
        },
    ];
    for (let i = 0; i < data.length; i++) {
        await repo.save(repo.create({ ...data[i], code: (0, code_util_1.makeCode)('PRJ', i + 1) }));
    }
}
//# sourceMappingURL=projects.seed.js.map