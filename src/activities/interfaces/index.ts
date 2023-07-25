export class Activities {
  id: number;
  name: string;
  courseId: number;
  peso: number;
  course?: Course;
  files?: Files[];
}
export class Course {
  id: number;
  name: string;
  sector: string;
  duration: number;
  users?: User[];
  activities: Activities[];
}

enum Profile {
  ALUNO,
  ADMIN,
}

export class User {
  id?: number;
  firstName: string;
  secondName?: string;
  email: string;
  course?: Course;
  profile: Profile;
  courseId?: number;
  createdAt?: Date;
  lastName?: string;
  avatar: string;
  password: string;
}

export class Files {
  id: number;
}

export interface IResponseCreateActivities {
  activity: Activities;
  email_sent_to: string[];
  files: File[];
}
