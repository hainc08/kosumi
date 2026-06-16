import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
export declare class ProjectsController {
    private svc;
    constructor(svc: ProjectsService);
    findAll(q: QueryProjectDto): Promise<import("./projects.service").ProjectWithRelations[]>;
    findOne(id: string): Promise<import("./projects.service").ProjectWithRelations>;
    create(dto: CreateProjectDto): Promise<import("./projects.service").ProjectWithRelations>;
    update(id: string, dto: UpdateProjectDto): Promise<import("./projects.service").ProjectWithRelations>;
    setStatus(id: string, status: string): Promise<import("./projects.service").ProjectWithRelations>;
    remove(id: string): Promise<void>;
}
