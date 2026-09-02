import { randomBytes } from 'node:crypto';
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

  generatePasswordResetLink(email: string): Promise<string> {
    return getAuth(this.app).generatePasswordResetLink(email);
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      await getAuth(this.app).getUserByEmail(email);
      return false;
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/user-not-found') return true;
      throw error;
    }
  }

  async createInvitedUser(email: string): Promise<void> {
    await getAuth(this.app).createUser({
      email,
      password: randomBytes(32).toString('base64url'),
      emailVerified: false,
    });
  }

  async deleteUserByEmail(email: string): Promise<void> {
    try {
      const user = await getAuth(this.app).getUserByEmail(email);
      await getAuth(this.app).deleteUser(user.uid);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code !== 'auth/user-not-found') throw error;
    }
  }

  updateUserEmail(firebaseUid: string, email: string): Promise<void> {
    return getAuth(this.app)
      .updateUser(firebaseUid, { email })
      .then(() => undefined);
  }

}
