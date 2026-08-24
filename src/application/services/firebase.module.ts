import { Global, Module } from '@nestjs/common';
import { FirebaseService } from '@services/firebase.service';
import { MailService } from '@services/mail.service';

/** Firebase Admin is a cross-cutting singleton, so it is provided globally. */
@Global()
@Module({
  providers: [FirebaseService, MailService],
  exports: [FirebaseService, MailService],
})
export class FirebaseModule {}
