import { AppDataSource } from '../../data-source'
import { seedSites } from './sites.seed'
import { seedWorkers } from './workers.seed'
import { seedCustomers } from './customers.seed'
import { seedProjects } from './projects.seed'
import { seedQuotes } from './quotes.seed'
import { seedTasks } from './tasks.seed'
import { seedTimesheet } from './timesheet.seed'

/**
 * Reset DB về dataset demo sạch: xóa toàn bộ dữ liệu nghiệp vụ (giữ bảng migrations)
 * rồi seed lại từ đầu. Dùng khi dữ liệu đã lẫn rác (vd: residue từ e2e test).
 *
 *   npm run db:reset
 *
 * CẢNH BÁO: lệnh này XÓA toàn bộ dữ liệu trong 12 bảng nghiệp vụ.
 */
const DATA_TABLES = [
  'task_assignments', 'tasks',
  'quote_payment_steps', 'quote_items', 'quotes',
  'timesheet_entries', 'projects',
  'customer_contacts', 'customers',
  'worker_contracts', 'workers', 'sites',
]

async function run() {
  await AppDataSource.initialize()
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const t of DATA_TABLES) await AppDataSource.query(`TRUNCATE TABLE \`${t}\``)
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1')
  console.log(`Đã xóa ${DATA_TABLES.length} bảng dữ liệu`)

  await seedSites(AppDataSource)
  await seedWorkers(AppDataSource)
  await seedCustomers(AppDataSource)
  await seedProjects(AppDataSource)
  await seedQuotes(AppDataSource)
  await seedTasks(AppDataSource)
  await seedTimesheet(AppDataSource)

  await AppDataSource.destroy()
  console.log('Reset + seed xong — dataset demo sạch')
}
run()
