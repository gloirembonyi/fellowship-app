import { StatusType } from './emailService';

export interface Application {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  address?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  motivation?: string;
  cvUrl?: string;
  status: StatusType;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationFormData = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>; 