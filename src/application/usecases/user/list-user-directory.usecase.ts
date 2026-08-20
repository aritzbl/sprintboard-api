import { Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IUserRepository, UserDirectoryResult } from '@entities/user/user.gateway';

@Injectable()
export class ListUserDirectoryUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(options: {
    query?: string;
    scope?: 'all' | 'admins' | 'members';
    page?: number;
    pageSize?: number;
  }): Promise<UserDirectoryResult & { page: number; pageSize: number }> {
    const page = Math.max(options.page ?? 1, 1);
    const pageSize = Math.min(Math.max(options.pageSize ?? 10, 1), 50);
    const isAdmin =
      options.scope === 'admins'
        ? true
        : options.scope === 'members'
          ? false
          : undefined;
    const result = await this.users.findDirectory({
      query: options.query,
      isAdmin,
      page,
      pageSize,
    });
    return { ...result, page, pageSize };
  }
}
