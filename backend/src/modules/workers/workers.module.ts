import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Worker } from './entities/worker.entity'
import { WorkerContract } from './entities/worker-contract.entity'
import { WorkersService } from './workers.service'
import { WorkersController } from './workers.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Worker, WorkerContract])],
  controllers: [WorkersController],
  providers: [WorkersService],
})
export class WorkersModule {}
