import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from './entities/project.entity'
import { Site } from '../sites/entities/site.entity'
import { Customer } from '../customers/entities/customer.entity'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Project, Site, Customer])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
