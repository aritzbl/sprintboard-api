/** Injection tokens for repository implementations (ports). */
export enum RepositoryName {
  USER = 'USER_REPOSITORY',
  PROJECT = 'PROJECT_REPOSITORY',
  SPRINT = 'SPRINT_REPOSITORY',
  EPIC = 'EPIC_REPOSITORY',
  TICKET = 'TICKET_REPOSITORY',
  PROJECT_MEMBER = 'PROJECT_MEMBER_REPOSITORY',
  INVITATION = 'INVITATION_REPOSITORY',
}

/**
 * Generic persistence port shared by all domain repositories. Concrete
 * repositories live in the infrastructure layer and may add domain-specific
 * query methods on top of this contract.
 */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  /** Marks an entity as deleted when its persistence model supports soft deletion. */
  softDelete(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
