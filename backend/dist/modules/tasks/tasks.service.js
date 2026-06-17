"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("./entities/task.entity");
const task_assignment_entity_1 = require("./entities/task-assignment.entity");
const worker_entity_1 = require("../workers/entities/worker.entity");
const quote_item_entity_1 = require("../quotes/entities/quote-item.entity");
const quote_entity_1 = require("../quotes/entities/quote.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const worker_display_util_1 = require("../../common/utils/worker-display.util");
let TasksService = class TasksService {
    repo;
    assignmentRepo;
    workerRepo;
    quoteItemRepo;
    dataSource;
    constructor(repo, assignmentRepo, workerRepo, quoteItemRepo, dataSource) {
        this.repo = repo;
        this.assignmentRepo = assignmentRepo;
        this.workerRepo = workerRepo;
        this.quoteItemRepo = quoteItemRepo;
        this.dataSource = dataSource;
    }
    toMini(w) {
        return { id: w.id, code: w.code, fullName: w.fullName, initials: (0, worker_display_util_1.deriveInitials)(w.fullName), avatarColor: (0, worker_display_util_1.avatarColorFor)(w.id) };
    }
    enrich(task, activeAssignments, workerById) {
        const assignments = activeAssignments
            .filter((a) => a.taskId === task.id)
            .map((a) => {
            const w = workerById.get(a.workerId);
            return { ...a, worker: w ? this.toMini(w) : undefined };
        });
        return {
            ...task,
            assignments,
            activeWorkers: assignments.map((a) => a.worker).filter((w) => !!w),
        };
    }
    async loadActiveAssignments(taskIds) {
        if (taskIds.length === 0)
            return { activeAssignments: [], workerById: new Map() };
        const activeAssignments = await this.assignmentRepo.find({ where: { taskId: (0, typeorm_2.In)(taskIds), isActive: true } });
        const workerIds = [...new Set(activeAssignments.map((a) => a.workerId))];
        const workers = workerIds.length ? await this.workerRepo.find({ where: { id: (0, typeorm_2.In)(workerIds) } }) : [];
        const workerById = new Map(workers.map((w) => [w.id, w]));
        return { activeAssignments, workerById };
    }
    async enrichMany(tasks) {
        if (tasks.length === 0)
            return [];
        const { activeAssignments, workerById } = await this.loadActiveAssignments(tasks.map((t) => t.id));
        return tasks.map((t) => this.enrich(t, activeAssignments, workerById));
    }
    async tasksForQuote(quoteId) {
        if (!quoteId)
            return [];
        const items = await this.quoteItemRepo.find({ where: { quoteId } });
        if (items.length === 0)
            return [];
        const itemIds = items.map((i) => i.id);
        const tasks = await this.repo.find({ where: { quoteItemId: (0, typeorm_2.In)(itemIds) }, order: { sortOrder: 'ASC' } });
        return this.enrichMany(tasks);
    }
    async tasksForProject(projectId) {
        if (!projectId)
            return [];
        const tasks = await this.repo.find({ where: { projectId }, order: { sortOrder: 'ASC' } });
        if (tasks.length === 0)
            return [];
        const enriched = await this.enrichMany(tasks);
        const itemIds = [...new Set(tasks.map((t) => t.quoteItemId).filter((id) => !!id))];
        const items = itemIds.length ? await this.quoteItemRepo.find({ where: { id: (0, typeorm_2.In)(itemIds) } }) : [];
        const sectionByItem = new Map(items.map((i) => [i.id, i.sectionName]));
        return enriched.map((t) => ({ ...t, section: t.quoteItemId ? (sectionByItem.get(t.quoteItemId) ?? null) : null }));
    }
    async generateFromQuote(quoteId) {
        const quote = await this.dataSource.getRepository(quote_entity_1.Quote).findOne({ where: { id: quoteId } });
        if (!quote)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        if (!quote.projectId)
            throw new common_1.BadRequestException('Báo giá chưa gắn dự án');
        const project = await this.dataSource.getRepository(project_entity_1.Project).findOne({ where: { id: quote.projectId } });
        if (!project)
            throw new common_1.NotFoundException('Không tìm thấy dự án');
        if (!project.siteId) {
            throw new common_1.BadRequestException('Dự án chưa có công trường — hãy gán công trường cho dự án trước khi tạo công việc');
        }
        const items = await this.quoteItemRepo.find({ where: { quoteId }, order: { sortOrder: 'ASC' } });
        if (items.length === 0)
            return { created: 0 };
        const existing = await this.repo.find({ where: { quoteItemId: (0, typeorm_2.In)(items.map((i) => i.id)) } });
        const haveItemIds = new Set(existing.map((t) => t.quoteItemId));
        const toCreate = items.filter((i) => !haveItemIds.has(i.id));
        if (toCreate.length === 0)
            return { created: 0 };
        const today = new Date().toISOString().slice(0, 10);
        const entities = toCreate.map((i) => this.repo.create({
            quoteItemId: i.id,
            projectId: project.id,
            siteId: project.siteId,
            title: i.itemName,
            description: i.description ?? null,
            taskDate: today,
            status: 'unassigned',
            priority: 'medium',
            sortOrder: i.sortOrder,
        }));
        await this.repo.save(entities);
        return { created: entities.length };
    }
    async generateForProject(projectId) {
        const quotes = await this.dataSource.getRepository(quote_entity_1.Quote).find({ where: { projectId } });
        let created = 0;
        for (const q of quotes) {
            const r = await this.generateFromQuote(q.id);
            created += r.created;
        }
        return { created };
    }
    async activeTasksAll() {
        const tasks = await this.repo.find();
        return this.enrichMany(tasks);
    }
    async availableWorkers(_siteId) {
        const busy = await this.assignmentRepo.find({ where: { isActive: true } });
        const busyIds = new Set(busy.map((a) => a.workerId));
        const workers = await this.workerRepo.find({ where: { status: 'working' } });
        return workers
            .filter((w) => !busyIds.has(w.id))
            .map((w) => ({ ...w, initials: (0, worker_display_util_1.deriveInitials)(w.fullName), avatarColor: (0, worker_display_util_1.avatarColorFor)(w.id) }));
    }
    async assign(taskId, workerId) {
        const task = await this.repo.findOne({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException('Không tìm thấy công việc');
        const existing = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } });
        if (existing)
            return existing;
        const now = new Date();
        const assignment = this.assignmentRepo.create({
            taskId,
            workerId,
            assignedAt: now,
            startedAt: now,
            endedAt: null,
            isActive: true,
            transferredFromTaskId: null,
        });
        const saved = await this.assignmentRepo.save(assignment);
        if (task.status === 'unassigned') {
            task.status = 'in_progress';
            await this.repo.save(task);
        }
        return saved;
    }
    async unassign(taskId, workerId) {
        const assignment = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } });
        if (assignment) {
            assignment.isActive = false;
            assignment.endedAt = new Date();
            await this.assignmentRepo.save(assignment);
        }
        const task = await this.repo.findOne({ where: { id: taskId } });
        if (task) {
            const stillActive = await this.assignmentRepo.count({ where: { taskId, isActive: true } });
            if (stillActive === 0 && task.status !== 'unassigned') {
                task.status = 'unassigned';
                await this.repo.save(task);
            }
        }
    }
    async transfer(workerId, fromTaskId, toTaskId) {
        await this.unassign(fromTaskId, workerId);
        const assignment = await this.assign(toTaskId, workerId);
        assignment.transferredFromTaskId = fromTaskId;
        return this.assignmentRepo.save(assignment);
    }
    async saveAssignments(draft) {
        let count = 0;
        for (const [taskId, workerIds] of Object.entries(draft)) {
            for (const workerId of workerIds) {
                await this.assign(taskId, workerId);
                count += 1;
            }
        }
        return count;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(task_assignment_entity_1.TaskAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(worker_entity_1.Worker)),
    __param(3, (0, typeorm_1.InjectRepository)(quote_item_entity_1.QuoteItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], TasksService);
//# sourceMappingURL=tasks.service.js.map