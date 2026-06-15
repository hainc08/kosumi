import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TimesheetEntry } from './entities/timesheet-entry.entity'
import { Worker } from '../workers/entities/worker.entity'
import { WorkerContract } from '../workers/entities/worker-contract.entity'
import { TimesheetService } from './timesheet.service'
import { TimesheetController } from './timesheet.controller'

@Module({
  imports: [TypeOrmModule.forFeature([TimesheetEntry, Worker, WorkerContract])],
  controllers: [TimesheetController],
  providers: [TimesheetService],
})
export class TimesheetModule {}
