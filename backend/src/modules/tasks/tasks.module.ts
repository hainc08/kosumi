import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Task } from './entities/task.entity'
import { TaskAssignment } from './entities/task-assignment.entity'
import { Worker } from '../workers/entities/worker.entity'
import { QuoteItem } from '../quotes/entities/quote-item.entity'
import { TasksService } from './tasks.service'
import { TasksController } from './tasks.controller'
import { ShiftScheduler } from './shift.scheduler'

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskAssignment, Worker, QuoteItem])],
  controllers: [TasksController],
  providers: [TasksService, ShiftScheduler],
})
export class TasksModule {}
