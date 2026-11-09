import { Exclude } from 'class-transformer';
import { Profile } from '@prisma/client';

export class UserEntity {
  id: number;
  createdAt: Date;
  firstName: string;
  lastName?: string | null;
  avatar?: string | null;
  profile: Profile;
  email: string;
  courseId?: number | null;

  @Exclude()
  password?: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
