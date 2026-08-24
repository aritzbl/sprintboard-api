import { Role } from '@entities/user/user.entity';

export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** Roles granted inside a project invitation. */
export const INVITABLE_ROLES: readonly Role[] = ['pm', 'dev', 'qa'] as const;

/**
 * A shareable invitation: the superadmin creates it with a role + the projects
 * to grant, and shares the link (token). Whoever accepts it gets that role and
 * membership in those projects.
 */
export class Invitation {
  id!: string;
  token!: string;
  email!: string | null;
  role!: Role;
  projectIds!: string[];
  status!: InvitationStatus;
  createdById!: string;
  acceptedById!: string | null;
  createdAt!: Date;
  expiresAt!: Date | null;
}
