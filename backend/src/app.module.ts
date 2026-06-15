import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SitesModule } from './modules/sites/sites.module'
import { WorkersModule } from './modules/workers/workers.module'
import { CustomersModule } from './modules/customers/customers.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { QuotesModule } from './modules/quotes/quotes.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { TimesheetModule } from './modules/timesheet/timesheet.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
      synchronize: false,
    }),
    SitesModule,
    WorkersModule,
    CustomersModule,
    ProjectsModule,
    QuotesModule,
    TasksModule,
    TimesheetModule,
  ],
})
export class AppModule {}
