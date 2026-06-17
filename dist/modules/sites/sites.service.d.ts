import { DataSource, Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
export type SiteWithCounts = Site & {
    workerCount: number;
    projectCount: number;
};
export declare class SitesService {
    private repo;
    private dataSource;
    constructor(repo: Repository<Site>, dataSource: DataSource);
    private loadAggregates;
    private enrich;
    findAll(q: QuerySiteDto): Promise<SiteWithCounts[]>;
    findOne(id: string): Promise<Site>;
    private findOneWithCounts;
    create(dto: CreateSiteDto): Promise<SiteWithCounts>;
    update(id: string, dto: UpdateSiteDto): Promise<SiteWithCounts>;
    setStatus(id: string, status: string): Promise<SiteWithCounts>;
    remove(id: string): Promise<void>;
}
