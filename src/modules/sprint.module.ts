import { Module } from '@nestjs/common';
import { SprintsController } from '@interfaces/http/controllers/sprints.controller';
import { ListSprintsUseCase } from '@usecases/sprint/list-sprints.usecase';
import { CreateSprintUseCase } from '@usecases/sprint/create-sprint.usecase';
import { UpdateSprintUseCase } from '@usecases/sprint/update-sprint.usecase';
import { CompleteSprintUseCase } from '@usecases/sprint/complete-sprint.usecase';
import { DeleteSprintUseCase } from '@usecases/sprint/delete-sprint.usecase';

@Module({
  controllers: [SprintsController],
  providers: [
    ListSprintsUseCase,
    CreateSprintUseCase,
    UpdateSprintUseCase,
    CompleteSprintUseCase,
    DeleteSprintUseCase,
  ],
})
export class SprintModule {}
