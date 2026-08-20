/** A high-level body of work inside a project. */
export class Epic {
  id!: string;
  projectId!: string;
  name!: string;
  description!: string | null;
  color!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
