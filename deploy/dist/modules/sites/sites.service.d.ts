import { DataSource, Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
export declare class SitesService {
    private repo;
    private dataSource;
    constructor(repo: Repository<Site>, dataSource: DataSource);
    findAll(q: QuerySiteDto): Promise<Site[]>;
    findOne(id: string): Promise<Site>;
    create(dto: CreateSiteDto): Promise<Site>;
    update(id: string, dto: UpdateSiteDto): Promise<Site>;
    setStatus(id: string, status: string): Promise<Site>;
    remove(id: string): Promise<void>;
}
