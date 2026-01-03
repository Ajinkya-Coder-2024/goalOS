export interface Subject {
  _id: string;
  name: string;
  description: string;
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Branch {
  _id: string;
  name: string;
  description?: string;
  subjects: Subject[];
  status: 'active' | 'completed' | 'paused';
  user: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StudyStatistics {
  totalBranches: number;
  activeBranches: number;
  completedBranches: number;
  totalSubjects: number;
}

export type BranchStatus = 'active' | 'completed' | 'paused';
