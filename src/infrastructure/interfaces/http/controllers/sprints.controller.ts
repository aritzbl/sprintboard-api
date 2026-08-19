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
import { Roles } from '@interfaces/http/middlewares/auth/roles.decorator';
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
  list(@Param('projectId') projectId: string): Promise<Sprint[]> {
    return this.listSprints.execute(projectId);
  }

  @Post('projects/:projectId/sprints')
  @Roles('superadmin', 'pm')
  @ApiOperation({ summary: 'Create a sprint (PM or superadmin)' })
  @ApiResponse({ status: 201, description: 'Sprint created' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
  ): Promise<Sprint> {
    return this.createSprint.execute(projectId, dto);
  }

  @Patch('sprints/:id')
  @Roles('superadmin', 'pm')
  @ApiOperation({ summary: 'Update a sprint, e.g. activate or complete it' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ): Promise<Sprint> {
    return this.updateSprint.execute(id, dto);
  }

  @Post('sprints/:id/complete')
  @Roles('superadmin', 'pm')
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
  ): Promise<Sprint> {
    return this.completeSprint.execute(id, dto);
  }

  @Delete('sprints/:id')
  @Roles('superadmin', 'pm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a sprint; its tickets return to the backlog',
  })
  @ApiResponse({ status: 204, description: 'Sprint deleted' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteSprint.execute(id);
  }
}
