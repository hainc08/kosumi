import { DataSource, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Site } from '../sites/entities/site.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
export type ProjectWithRelations = Project & {
    site?: {
        id: string;
        name: string;
    };
    customer?: {
        id: string;
        name: string;
    };
    quoteCount: number;
    workerCount: number;
};
export declare class ProjectsService {
    private repo;
    private siteRepo;
    private customerRepo;
    private dataSource;
    constructor(repo: Repository<Project>, siteRepo: Repository<Site>, customerRepo: Repository<Customer>, dataSource: DataSource);
    private enrich;
    private enrichMany;
    findAll(q: QueryProjectDto): Promise<ProjectWithRelations[]>;
    findOne(id: string): Promise<ProjectWithRelations>;
    create(dto: CreateProjectDto): Promise<ProjectWithRelations>;
    update(id: string, dto: UpdateProjectDto): Promise<ProjectWithRelations>;
    setStatus(id: string, status: string): Promise<ProjectWithRelations>;
    remove(id: string): Promise<void>;
}
