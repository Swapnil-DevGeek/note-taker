export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const UNUSED = 'this ensures the module is not empty';

export type Theme = 'light' | 'dark';
