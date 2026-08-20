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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@interfaces/http/middlewares/auth/current-user.decorator';
import { User } from '@entities/user/user.entity';
import { Sprint } from '@entities/sprint/sprint.entity';
import {
  CompleteSprintDto,
  CreateSprintDto,
  UpdateSprintDto,
} from '@entities/sprint/sprint.types';
import { ListSprintsUseCase } from '@usecases/sprint/list-sprints.usecase';
import { CreateSprintUseCase } from '@usecases/sprint/create-sprint.usecase';
import { UpdateSprintUseCase } from '@usecases/sprint/update-sprint.usecase';
import { CompleteSprintUseCase } from '@usecases/sprint/complete-sprint.usecase';
import { DeleteSprintUseCase } from '@usecases/sprint/delete-sprint.usecase';

// Collection routes are nested under a project; item routes live under /sprints.
@ApiTags('Sprints')
@ApiBearerAuth('JWT-auth')
@Controller()
export class SprintsController {
  constructor(
    private readonly listSprints: ListSprintsUseCase,
    private readonly createSprint: CreateSprintUseCase,
    private readonly updateSprint: UpdateSprintUseCase,
    private readonly completeSprint: CompleteSprintUseCase,
    private readonly deleteSprint: DeleteSprintUseCase,
  ) {}

  @Get('projects/:projectId/sprints')
  @ApiOperation({ summary: 'List the sprints of a project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ): Promise<Sprint[]> {
    return this.listSprints.execute(projectId, user);
  }

  @Post('projects/:projectId/sprints')
  @ApiOperation({ summary: 'Create a sprint (PM or superadmin)' })
  @ApiResponse({ status: 201, description: 'Sprint created' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @CurrentUser() user: User,
  ): Promise<Sprint> {
    return this.createSprint.execute(projectId, dto, user);
  }

  @Patch('sprints/:id')
  @ApiOperation({ summary: 'Update a sprint, e.g. activate or complete it' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
    @CurrentUser() user: User,
  ): Promise<Sprint> {
    return this.updateSprint.execute(id, dto, user);
  }

  @Post('sprints/:id/complete')
  @ApiOperation({
    summary:
      'Complete a sprint; unfinished tickets move to the backlog or another sprint',
  })
  @ApiResponse({ status: 200, description: 'Sprint completed' })
  @ApiResponse({ status: 400, description: 'Invalid target sprint' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteSprintDto,
    @CurrentUser() user: User,
  ): Promise<Sprint> {
    return this.completeSprint.execute(id, dto, user);
  }

  @Delete('sprints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a sprint; its tickets return to the backlog',
  })
  @ApiResponse({ status: 204, description: 'Sprint deleted' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.deleteSprint.execute(id, user);
  }
}
