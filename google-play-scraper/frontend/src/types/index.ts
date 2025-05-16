export type AppInfo = {
  name: string;
  icon: string;
  rating: number;
};

export type KpiData = {
  total: number;
  complaints: number;
  praise: number;
  features: number;
};

export type FeedbackItem = {
  summary: string;
  quote: string;
  confidence?: number;
};

export type SubCategory = 
  | 'Performance'
  | 'Bugs'
  | 'Pricing'
  | 'UX'
  | 'Integration Issues'
  | 'Support';

export type FeedbackCategory = {
  subcategory: SubCategory;
  count: number;
  items: FeedbackItem[];
  confidence?: number;
};

export type AnalysisResult = {
  app: AppInfo;
  kpi: KpiData;
  complaints: FeedbackCategory[];
  praise: FeedbackCategory[];
  feature_requests: FeedbackCategory[];
};

export interface AnalysisProgress {
  progress: number;
  stage: string;
  status?: 'starting' | 'running' | 'error' | 'done' | 'completed';
}

export type AnalysisState = 'idle' | 'loading' | 'done' | 'error';

export type Plan = 'free' | 'pro';