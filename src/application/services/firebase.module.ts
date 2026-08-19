import { Global, Module } from '@nestjs/common';
import { FirebaseService } from '@services/firebase.service';

/** Firebase Admin is a cross-cutting singleton, so it is provided globally. */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
