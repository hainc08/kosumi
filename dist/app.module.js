"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const sites_module_1 = require("./modules/sites/sites.module");
const workers_module_1 = require("./modules/workers/workers.module");
const customers_module_1 = require("./modules/customers/customers.module");
const projects_module_1 = require("./modules/projects/projects.module");
const quotes_module_1 = require("./modules/quotes/quotes.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const timesheet_module_1 = require("./modules/timesheet/timesheet.module");
const logs_module_1 = require("./modules/logs/logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'client'),
                exclude: ['/api/{*splat}'],
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DATABASE_HOST,
                port: Number(process.env.DATABASE_PORT),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
                synchronize: false,
                timezone: '+00:00',
            }),
            sites_module_1.SitesModule,
            workers_module_1.WorkersModule,
            customers_module_1.CustomersModule,
            projects_module_1.ProjectsModule,
            quotes_module_1.QuotesModule,
            tasks_module_1.TasksModule,
            timesheet_module_1.TimesheetModule,
            logs_module_1.LogsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map