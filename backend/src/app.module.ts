import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { SitesModule } from './modules/sites/sites.module'
import { WorkersModule } from './modules/workers/workers.module'
import { CustomersModule } from './modules/customers/customers.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { QuotesModule } from './modules/quotes/quotes.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { TimesheetModule } from './modules/timesheet/timesheet.module'
import { LogsModule } from './modules/logs/logs.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Phục vụ frontend (React build) ngay từ backend → 1 domain duy nhất, không CORS.
    // FE build được copy vào backend/client; mọi path /api* loại trừ để rơi vào controller.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/{*splat}'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
      synchronize: false,
      // Ép driver coi mọi datetime là UTC để app-ghi (@CreateDateColumn) khớp với
      // current_timestamp() của DB; tránh lệch giờ làm ORDER BY created_at sai thứ tự
      // (nguyên nhân bản ghi mới "tạo xong không hiển thị" trên server khác múi giờ).
      timezone: '+00:00',
    }),
    SitesModule,
    WorkersModule,
    CustomersModule,
    ProjectsModule,
    QuotesModule,
    TasksModule,
    TimesheetModule,
    LogsModule,
  ],
})
export class AppModule {}
