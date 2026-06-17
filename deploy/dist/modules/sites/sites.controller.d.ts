import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
export declare class SitesController {
    private svc;
    constructor(svc: SitesService);
    findAll(q: QuerySiteDto): Promise<import("./sites.service").SiteWithCounts[]>;
    findOne(id: string): Promise<import("./entities/site.entity").Site>;
    create(dto: CreateSiteDto): Promise<import("./sites.service").SiteWithCounts>;
    update(id: string, dto: UpdateSiteDto): Promise<import("./sites.service").SiteWithCounts>;
    setStatus(id: string, status: string): Promise<import("./sites.service").SiteWithCounts>;
    remove(id: string): Promise<void>;
}
