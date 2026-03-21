export type ExperimentStatus = 'pending' | 'completed' | 'submitted';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

export interface Experiment {
  id: string;
  shortCode: string;
  title: string;
  description?: string;
}

export interface StatusEntry {
  courseId: string;
  studentId: string;
  experimentId: string;
  status: ExperimentStatus;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  students: Student[];
  experiments: Experiment[];
}

export const STATUS_CYCLE: ExperimentStatus[] = ['pending', 'completed', 'submitted'];

export function nextStatus(current: ExperimentStatus): ExperimentStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}
