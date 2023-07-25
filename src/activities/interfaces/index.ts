export class Activities {
  id: number;
  name: string;
  courseId: number;
  peso: number;
  course?: Course;
}
export class Course {
  id: number;
  name: string;
  sector: string;
  duration: number;
  users?: User[];
  activities: Activities[];
}

export class User {
  id: number;
  firstName: string;
  secondName: string;
  email: string;
  course?: Course;
}

export class Files {
  id: number;
}
