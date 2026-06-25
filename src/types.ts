export interface ExamEntry {
  id: string;
  stt: string;
  commune: string;
  location: string;
  date: string;
  target: number | null;
  totalExamined: number;
  age0to6: number;
  age6to18: number;
  age18to60_community: number;
  age18to60_worker: number;
  age18to60_officer: number;
  ageAbove60: number;
  notes: string;
  status: 'Hoạt động' | 'Đã hủy';
}

export interface CommuneSummary {
  name: string;
  totalTarget: number;
  totalExamined: number;
  total0to6: number;
  total6to18: number;
  total18to60_community: number;
  total18to60_worker: number;
  total18to60_officer: number;
  totalAbove60: number;
  activeCount: number;
  cancelledCount: number;
}
