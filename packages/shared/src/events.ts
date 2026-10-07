export const SOCKET_EVENTS = {
  FILE_UPLOAD_STARTED: 'file:upload:started',
  FILE_UPLOAD_PROCESSING: 'file:upload:processing',
  FILE_PROCESSING_PROGRESS: 'file:processing:progress',
  FILE_UPLOAD_COMPLETED: 'file:upload:completed',
  FILE_UPLOAD_FAILED: 'file:upload:failed',
  FILE_DOWNLOAD_STARTED: 'file:download:started',
  FILE_DOWNLOAD_COMPLETED: 'file:download:completed',
  FILE_DOWNLOAD_FAILED: 'file:download:failed',
  FILE_DELETED: 'file:deleted',
  NOTIFICATION_CREATED: 'notification:created',
  LEAD_CREATED: 'lead:created',
  LEAD_UPDATED: 'lead:updated',
  LEAD_STATUS_CHANGED: 'lead:status:changed',
  FOLLOWUP_CREATED: 'followup:created',
  FOLLOWUP_UPDATED: 'followup:updated',
  FOLLOWUP_COMPLETED: 'followup:completed',
  CANDIDATE_CREATED: 'candidate:created',
  CANDIDATE_STAGE_CHANGED: 'candidate:stage:changed',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_PAID: 'invoice:paid',
} as const;

export type FileEventPayload = {
  eventId: string;
  timestamp: string;
  fileId: string;
  operationId: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  progress: number;
  processedBytes?: number;
  totalBytes?: number;
  message?: string;
};
