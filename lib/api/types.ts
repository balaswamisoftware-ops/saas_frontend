/** Response envelope contract shared with the backend's ApiResponse helper. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  [key: string]: unknown;
}

/** Normalised error thrown by the API client. */
export interface ApiErrorShape {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];
}
