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

/**
 * Generic paginated server response.
 */
export interface PaginatedResponse<T> {
  items: T[];
  /** Page index starting at 1 */
  page: number;
  /** Max results per page */
  limit: number;
  /** Total number of items available on the server */
  total: number;
}

/**
 * Allowed sort orders when requesting paginated reviews
 * (expand as new server‑side options become available).
 */
export type SortOrder =
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'highest_rating'
  | 'lowest_rating';

export type SubCategory = string;

export type FeedbackCategory = {
  subcategory: SubCategory;
  items: FeedbackItem[];
  count: number;
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