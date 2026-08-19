import { Module } from '@nestjs/common';
import { ProjectsController } from '@interfaces/http/controllers/projects.controller';
import { ListProjectsUseCase } from '@usecases/project/list-projects.usecase';
import { GetProjectUseCase } from '@usecases/project/get-project.usecase';
import { CreateProjectUseCase } from '@usecases/project/create-project.usecase';
import { UpdateProjectUseCase } from '@usecases/project/update-project.usecase';
import { DeleteProjectUseCase } from '@usecases/project/delete-project.usecase';
import { ListProjectMembersUseCase } from '@usecases/member/list-project-members.usecase';
import { AddMemberUseCase } from '@usecases/member/add-member.usecase';
import { RemoveMemberUseCase } from '@usecases/member/remove-member.usecase';

@Module({
  controllers: [ProjectsController],
  providers: [
    ListProjectsUseCase,
    GetProjectUseCase,
    CreateProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
    ListProjectMembersUseCase,
    AddMemberUseCase,
    RemoveMemberUseCase,
  ],
})
export class ProjectModule {}
