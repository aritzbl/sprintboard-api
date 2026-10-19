import { Global, Module } from '@nestjs/common';
import { StorageService } from '@services/storage.service';

/** One S3 client for the whole app, provided globally like FirebaseModule. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
