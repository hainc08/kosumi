"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../../data-source");
const sites_seed_1 = require("./sites.seed");
const workers_seed_1 = require("./workers.seed");
const customers_seed_1 = require("./customers.seed");
const projects_seed_1 = require("./projects.seed");
const quotes_seed_1 = require("./quotes.seed");
const tasks_seed_1 = require("./tasks.seed");
const timesheet_seed_1 = require("./timesheet.seed");
async function run() {
    await data_source_1.AppDataSource.initialize();
    await (0, sites_seed_1.seedSites)(data_source_1.AppDataSource);
    await (0, workers_seed_1.seedWorkers)(data_source_1.AppDataSource);
    await (0, customers_seed_1.seedCustomers)(data_source_1.AppDataSource);
    await (0, projects_seed_1.seedProjects)(data_source_1.AppDataSource);
    await (0, quotes_seed_1.seedQuotes)(data_source_1.AppDataSource);
    await (0, tasks_seed_1.seedTasks)(data_source_1.AppDataSource);
    await (0, timesheet_seed_1.seedTimesheet)(data_source_1.AppDataSource);
    await data_source_1.AppDataSource.destroy();
    console.log('Seed xong');
}
run();
//# sourceMappingURL=run-seed.js.map