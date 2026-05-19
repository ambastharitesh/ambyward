export type ProjectStatus = 'New' | 'Accepted' | 'Submitted' | 'Completed' | 'Expired';
export type ProjectType = 'in-store' | 'online' | 'survey' | 'survey + at-home' | 'at-home';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  type: ProjectType;
  closeDate: string;
  points: number;
}

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Whole Foods Beverage Taste Test',
    status: 'New',
    type: 'in-store',
    closeDate: 'Jun 20',
    points: 1000,
  },
  {
    id: 'p2',
    name: 'Skincare Routine Feedback',
    status: 'New',
    type: 'survey + at-home',
    closeDate: 'Jun 25',
    points: 1500,
  },
  {
    id: 'p3',
    name: 'Summer Snack Review',
    status: 'Accepted',
    type: 'at-home',
    closeDate: 'Jun 18',
    points: 800,
  },
  {
    id: 'p4',
    name: 'Coffee Brand Awareness Survey',
    status: 'Submitted',
    type: 'survey',
    closeDate: 'Jun 10',
    points: 600,
  },
  {
    id: 'p5',
    name: 'Laptop Accessory Unboxing',
    status: 'Completed',
    type: 'at-home',
    closeDate: 'May 30',
    points: 1200,
  },
  {
    id: 'p6',
    name: 'Home Cleaning Product Test',
    status: 'Expired',
    type: 'in-store',
    closeDate: 'May 15',
    points: 700,
  },
  {
    id: 'p7',
    name: 'Meal Kit Delivery Review',
    status: 'Completed',
    type: 'online',
    closeDate: 'May 22',
    points: 950,
  },
];

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  New: {
    label: 'New',
    dotColor: 'bg-secondary-main',
    textColor: 'text-secondary-dark',
    bgColor: 'bg-secondary-light',
  },
  Accepted: {
    label: 'Accepted',
    dotColor: 'bg-primary-main',
    textColor: 'text-primary-dark',
    bgColor: 'bg-primary-light',
  },
  Submitted: {
    label: 'Submitted',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  Completed: {
    label: 'Completed',
    dotColor: 'bg-text-secondary',
    textColor: 'text-text-secondary',
    bgColor: 'bg-gray-100',
  },
  Expired: {
    label: 'Expired',
    dotColor: 'bg-error',
    textColor: 'text-error',
    bgColor: 'bg-red-50',
  },
};
