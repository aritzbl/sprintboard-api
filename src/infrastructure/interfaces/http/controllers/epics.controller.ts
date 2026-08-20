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
import { Epic } from '@entities/epic/epic.entity';
import { CreateEpicDto, UpdateEpicDto } from '@entities/epic/epic.types';
import { User } from '@entities/user/user.entity';
import { CreateEpicUseCase } from '@usecases/epic/create-epic.usecase';
import { DeleteEpicUseCase } from '@usecases/epic/delete-epic.usecase';
import { ListEpicsUseCase } from '@usecases/epic/list-epics.usecase';
import { UpdateEpicUseCase } from '@usecases/epic/update-epic.usecase';
import { CurrentUser } from '@interfaces/http/middlewares/auth/current-user.decorator';

@ApiTags('Epics')
@ApiBearerAuth('JWT-auth')
@Controller()
export class EpicsController {
  constructor(
    private readonly listEpics: ListEpicsUseCase,
    private readonly createEpic: CreateEpicUseCase,
    private readonly updateEpic: UpdateEpicUseCase,
    private readonly deleteEpic: DeleteEpicUseCase,
  ) {}

  @Get('projects/:projectId/epics')
  @ApiOperation({ summary: 'List epics of a project' })
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ): Promise<Epic[]> {
    return this.listEpics.execute(projectId, user);
  }

  @Post('projects/:projectId/epics')
  @ApiOperation({ summary: 'Create an epic (project PM or superadmin)' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEpicDto,
    @CurrentUser() user: User,
  ): Promise<Epic> {
    return this.createEpic.execute(projectId, dto, user);
  }

  @Patch('epics/:id')
  @ApiOperation({ summary: 'Update an epic (project PM or superadmin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEpicDto,
    @CurrentUser() user: User,
  ): Promise<Epic> {
    return this.updateEpic.execute(id, dto, user);
  }

  @Delete('epics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an epic only when it has no associated tickets' })
  @ApiResponse({ status: 204, description: 'Epic deleted' })
  @ApiResponse({ status: 409, description: 'Epic still has associated tickets' })
  remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.deleteEpic.execute(id, user);
  }
}
