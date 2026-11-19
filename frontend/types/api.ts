/**
 * Unified API Response and Error Types matching backend envelopes
 */

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export class AppApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'api_error', statusCode: number = 500) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
