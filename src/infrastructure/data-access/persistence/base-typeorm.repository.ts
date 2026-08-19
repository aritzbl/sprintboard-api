import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { IBaseRepository } from '@entities/shared/base-repository.gateway';

/**
 * Base repository that adapts a TypeORM Repository to the domain-facing
 * IBaseRepository port. Subclasses provide the ORM<->domain mapping so the
 * application layer never sees TypeORM entities.
 */
export abstract class BaseTypeOrmRepository<
  O extends ObjectLiteral & { id: string },
  D,
> implements IBaseRepository<D>
{
  protected constructor(protected readonly repository: Repository<O>) {}

  /** Map a persistence row to its domain representation. */
  protected abstract toDomain(orm: O): D;

  async findById(id: string): Promise<D | null> {
    const found = await this.repository.findOne({
      where: { id } as FindOptionsWhere<O>,
    });
    return found ? this.toDomain(found) : null;
  }

  async findAll(): Promise<D[]> {
    const rows = await this.repository.find();
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
