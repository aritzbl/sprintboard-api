import { Role } from '@entities/user/user.entity';
import {
  Invitation,
  InvitationStatus,
} from '@entities/invitation/invitation.entity';

export interface CreateInvitationData {
  token: string;
  email: string | null;
  role: Role;
  projectIds: string[];
  createdById: string;
  expiresAt: Date | null;
}

export interface UpdateInvitationData {
  token?: string;
  email?: string;
  status?: InvitationStatus;
  acceptedById?: string | null;
  expiresAt?: Date | null;
}

export interface IInvitationRepository {
  findById(id: string): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  findAll(): Promise<Invitation[]>;
  create(data: CreateInvitationData): Promise<Invitation>;
  update(id: string, patch: UpdateInvitationData): Promise<Invitation | null>;
}
