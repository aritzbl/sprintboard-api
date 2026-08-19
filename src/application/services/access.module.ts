import { Global, Module } from '@nestjs/common';
import { ProjectAccessService } from '@services/project-access.service';

/** Provides ProjectAccessService app-wide for membership checks. */
@Global()
@Module({
  providers: [ProjectAccessService],
  exports: [ProjectAccessService],
})
export class AccessModule {}
