import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { EnvVar } from '@config/env-var';

/**
 * Thin wrapper around the Firebase Admin SDK. It is the only place that talks
 * to Firebase Auth; the rest of the app depends on this service, not on
 * firebase-admin directly.
 */
@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly app: App;

  constructor(private readonly config: ConfigService) {
    const privateKey = this.config
      .getOrThrow<string>(EnvVar.FIREBASE_PRIVATE_KEY)
      .replace(/\\n/g, '\n');

    this.app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: this.config.getOrThrow<string>(EnvVar.FIREBASE_PROJECT_ID),
          clientEmail: this.config.getOrThrow<string>(
            EnvVar.FIREBASE_CLIENT_EMAIL,
          ),
          privateKey,
        }),
      });

    this.logger.log('Firebase Admin initialized');
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await getAuth(this.app).verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
