import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@interfaces/http/middlewares/auth/roles.decorator';
import { CurrentUser } from '@interfaces/http/middlewares/auth/current-user.decorator';
import { User } from '@entities/user/user.entity';
import { Project } from '@entities/project/project.entity';
import { ProjectMember } from '@entities/project-member/project-member.entity';
import {
  AddMemberDto,
  UpdateMemberRoleDto,
  CreateProjectDto,
  UpdateProjectDto,
} from '@entities/project/project.types';
import { ListProjectsUseCase } from '@usecases/project/list-projects.usecase';
import { GetProjectUseCase } from '@usecases/project/get-project.usecase';
import { CreateProjectUseCase } from '@usecases/project/create-project.usecase';
import { UpdateProjectUseCase } from '@usecases/project/update-project.usecase';
import { DeleteProjectUseCase } from '@usecases/project/delete-project.usecase';
import {
  ListProjectMembersUseCase,
  PaginatedProjectMembers,
} from '@usecases/member/list-project-members.usecase';
import { AddMemberUseCase } from '@usecases/member/add-member.usecase';
import { RemoveMemberUseCase } from '@usecases/member/remove-member.usecase';
import { UpdateMemberRoleUseCase } from '@usecases/member/update-member-role.usecase';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly listProjects: ListProjectsUseCase,
    private readonly getProject: GetProjectUseCase,
    private readonly createProject: CreateProjectUseCase,
    private readonly updateProject: UpdateProjectUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
    private readonly listProjectMembers: ListProjectMembersUseCase,
    private readonly addMember: AddMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly updateMemberRole: UpdateMemberRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the projects the caller can access' })
  list(@CurrentUser() user: User): Promise<Project[]> {
    return this.listProjects.execute(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id (must be a member)' })
  @ApiResponse({ status: 403, description: 'No access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.getProject.execute(id, user);
  }

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a project (superadmin)' })
  @ApiResponse({ status: 409, description: 'Project key already in use' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.createProject.execute(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project (PM or superadmin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.updateProject.execute(id, dto, user);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a project and all its sprints/tickets/members (superadmin)',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteProject.execute(id);
  }

  // ---- Membership ----

  @Get(':projectId/members')
  @ApiOperation({ summary: 'List the members of a project' })
  members(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedProjectMembers> {
    const normalizedPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
    const normalizedPageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(pageSize ?? '10', 10) || 10),
    );
    return this.listProjectMembers.execute(
      projectId,
      user,
      normalizedPage,
      normalizedPageSize,
    );
  }

  @Post(':projectId/members')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Add a member to a project (superadmin)' })
  @ApiResponse({ status: 201, description: 'Member added' })
  add(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
  ): Promise<ProjectMember> {
    return this.addMember.execute(projectId, dto.userId, dto.role);
  }

  @Delete(':projectId/members/:userId')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a project (superadmin)' })
  removeMemberFromProject(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.removeMember.execute(projectId, userId);
  }

  @Patch(':projectId/members/:userId/role')
  @Roles('superadmin')
  changeMemberRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<ProjectMember> {
    return this.updateMemberRole.execute(projectId, userId, dto.role);
  }
}
