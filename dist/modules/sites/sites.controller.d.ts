import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
export declare class SitesController {
    private svc;
    constructor(svc: SitesService);
    findAll(q: QuerySiteDto): Promise<import("./entities/site.entity").Site[]>;
    findOne(id: string): Promise<import("./entities/site.entity").Site>;
    create(dto: CreateSiteDto): Promise<import("./entities/site.entity").Site>;
    update(id: string, dto: UpdateSiteDto): Promise<import("./entities/site.entity").Site>;
    setStatus(id: string, status: string): Promise<import("./entities/site.entity").Site>;
    remove(id: string): Promise<void>;
}
