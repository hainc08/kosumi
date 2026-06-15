import { AppDataSource } from '../../data-source'
import { seedSites } from './sites.seed'

async function run() {
  await AppDataSource.initialize()
  await seedSites(AppDataSource)
  await AppDataSource.destroy()
  console.log('Seed xong')
}
run()
