import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@services/firebase.service';
import { MailService } from '@services/mail.service';

@Injectable()
export class SendPasswordResetUseCase {
  constructor(private readonly firebase: FirebaseService, private readonly mail: MailService) {}

  async execute(email: string): Promise<void> {
    let link: string;
    try {
      link = await this.firebase.generatePasswordResetLink(email);
    } catch {
      // Never reveal whether an account exists.
      return;
    }

    this.mail.sendPasswordResetInBackground(email, link);
  }
}
