export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: Date;
  image: string;
  bio: string;
  isMember: boolean;
  isAdmin: boolean;
  dateOfBirth: Date;
  createdAt: Date;
  updatedAt: Date;
}
