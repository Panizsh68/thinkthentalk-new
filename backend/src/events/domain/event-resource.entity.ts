import { ResourceAccessLevel } from '@prisma/client';

export class EventResourceEntity {
  constructor(
    public readonly id: string,
    public readonly title: { fa: string; en: string },
    public readonly accessLevel: ResourceAccessLevel,
    public readonly url: string,
    public readonly description?: string | null,
  ) {}
}
