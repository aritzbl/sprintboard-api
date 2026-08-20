import { Module } from '@nestjs/common';
import { EpicsController } from '@interfaces/http/controllers/epics.controller';
import { CreateEpicUseCase } from '@usecases/epic/create-epic.usecase';
import { DeleteEpicUseCase } from '@usecases/epic/delete-epic.usecase';
import { ListEpicsUseCase } from '@usecases/epic/list-epics.usecase';
import { UpdateEpicUseCase } from '@usecases/epic/update-epic.usecase';

@Module({
  controllers: [EpicsController],
  providers: [
    ListEpicsUseCase,
    CreateEpicUseCase,
    UpdateEpicUseCase,
    DeleteEpicUseCase,
  ],
})
export class EpicModule {}
