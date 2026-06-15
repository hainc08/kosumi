import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SitesModule } from './modules/sites/sites.module'
import { WorkersModule } from './modules/workers/workers.module'
import { CustomersModule } from './modules/customers/customers.module'

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
  ],
})
export class AppModule {}
