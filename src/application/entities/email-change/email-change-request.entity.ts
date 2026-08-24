export const EMAIL_CHANGE_STATUSES = [
  'pending',
  'confirmed',
  'expired',
] as const;

export type EmailChangeStatus = (typeof EMAIL_CHANGE_STATUSES)[number];

/** One-time confirmation sent to the new email before it replaces the account email. */
export class EmailChangeRequest {
  id!: string;
  userId!: string;
  newEmail!: string;
  token!: string;
  status!: EmailChangeStatus;
  expiresAt!: Date;
  createdAt!: Date;
  confirmedAt!: Date | null;
}
