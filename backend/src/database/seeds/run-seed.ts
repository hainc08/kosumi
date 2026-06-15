import { AppDataSource } from '../../data-source'
import { seedSites } from './sites.seed'
import { seedWorkers } from './workers.seed'
import { seedCustomers } from './customers.seed'

async function run() {
  await AppDataSource.initialize()
  await seedSites(AppDataSource)
  await seedWorkers(AppDataSource)
  await seedCustomers(AppDataSource)
  await AppDataSource.destroy()
  console.log('Seed xong')
}
run()
