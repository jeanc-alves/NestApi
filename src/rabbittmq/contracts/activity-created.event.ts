export interface StudentRecipient {
  id: number;
  name: string;
  email: string;
}

export interface ActivityCreatedEvent {
  messageId: string;
  eventType: 'activity.created';
  timestamp: string;
  data: {
    activityId: number;
    activityName: string;
    courseId: number;
    courseName: string;
    peso: number;
    students: StudentRecipient[];
  };
}
