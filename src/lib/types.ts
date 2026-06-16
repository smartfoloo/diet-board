// Shared types for the Diet Kanban board.

export const STAGES = ['提出', '委員会審議', '本会議', '参議院', '成立', '廃案'] as const;
export type Stage = (typeof STAGES)[number];

/** Columns rendered on the board (成立 and 廃案 share the final column). */
export const COLUMNS: { id: Stage; label: string; sub?: string }[] = [
  { id: '提出', label: '提出', sub: 'Submitted' },
  { id: '委員会審議', label: '委員会審議', sub: 'In committee' },
  { id: '本会議', label: '本会議', sub: 'Plenary' },
  { id: '参議院', label: '参議院', sub: 'Other house' },
  { id: '成立', label: '成立・廃案', sub: 'Enacted / Failed' }
];

export type Heat = 'normal' | 'warm' | 'hot';

export interface VoteRecord {
  house: '衆' | '参';
  /** Faction-level breakdown when available (HoR data). */
  forParties: string[];
  againstParties: string[];
  attitude?: string; // 会派態度: 全会一致 / 多数 など
  result?: string; // 可決 / 否決 / 修正 など
  /** Numeric tally when available (HoC roll-call). */
  tally?: { for: number; against: number };
  method?: string; // 採決方法
}

export interface TimelineEvent {
  date: string | null; // ISO yyyy-mm-dd
  label: string;
  house?: '衆' | '参';
  detail?: string; // committee name, result, law number, etc.
}

export interface Bill {
  id: string;
  session: number;
  number: number;
  title: string;
  billType: string; // 閣法 / 衆法 / 参法
  submitter: string; // 内閣 or proposer name
  submitterParty: string | null; // canonical faction key for coloring
  submitterParties: string[]; // raw faction list
  category: string; // derived policy category
  status: string; // 審議状況 (raw)
  stage: Stage;
  finalState: '成立' | '廃案' | null; // for the merged final column
  stageEnteredDate: string | null;
  daysInStage: number | null;
  heat: Heat;
  timeline: TimelineEvent[];
  votes: VoteRecord[];
  summary: string | null;
  links: {
    progress?: string;
    fullText?: string;
    detail?: string; // sangiin meisai page
    outlinePdf?: string;
  };
}

export interface Meta {
  session: number;
  updatedAt: string;
  generatedAt: string;
  billCount: number;
  categories: string[];
  parties: { key: string; label: string; color: string }[];
  heatThresholds: Record<Stage, { warm: number; hot: number }>;
}
