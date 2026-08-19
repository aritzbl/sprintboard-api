import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '@entities/user/user.entity';

/** Express request enriched by FirebaseAuthGuard. */
export interface AuthenticatedRequest extends Request {
  firebaseToken?: DecodedIdToken;
  /** The synced domain user, or null when the profile has not been created. */
  currentUser?: User | null;
}
