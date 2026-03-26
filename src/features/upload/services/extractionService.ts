import api from "@/lib/axios";
import { ENDPOINTS } from "@/config/env";
import { isAxiosError } from "axios";

export interface ExtractionResult {
  status_code?: number;
  document_type: "po";
  extracted_data: Record<string, unknown>;
  score?: {
    total_score: number;
    max_possible: number;
    percentage: number;
    requires_review: boolean;
    /** Fields that must be present for auto-approval (missing ones trigger human review) */
    critical_fields_missing: string[];
    breakdown: Array<{
      field: string;
      max_score: number;
      actual_score: number;
      reason: string;
    }>;
  };
  stored_record?: {
    id: number;
    invoice_number?: string;
    po_number?: string;
  };
  file_url?: string;
  message?: string;
  duplicate?: boolean;
  /**
   * Fields whose values were auto-generated because they were missing in the extraction.
   * The reviewer MUST update these before the document can be considered valid.
   */
  auto_generated_fields?: string[];
}

export interface ExtractionJobResponse {
  job_id: string;
  status: "ENQUEUED";
}

interface ExtractionResultStatusResponse {
  status: "PENDING" | "COMPLETED" | "FAILED" | "RETRY";
  result?: ExtractionResult;
  message?: string;
  error?: string;
}

export interface PendingReviewsResponse {
  invoices: ExtractionResult[];
  purchase_orders: ExtractionResult[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class BackgroundProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackgroundProcessingError";
  }
}

export const extractionService = {
  async uploadPurchaseOrder(file: File): Promise<ExtractionJobResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", "po");

    const { data } = await api.post<ExtractionJobResponse>(
      ENDPOINTS.EXTRACTION.UPLOAD_PO,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  async getExtractionResult(jobId: string): Promise<ExtractionResultStatusResponse> {
    const { data } = await api.get<ExtractionResultStatusResponse>(
      ENDPOINTS.EXTRACTION.RESULT(jobId)
    );
    return data;
  },

  async checkExtractionStatus(jobId: string): Promise<ExtractionResultStatusResponse> {
    return this.getExtractionResult(jobId);
  },

  /**
   * Polls the result endpoint until COMPLETED or FAILED.
   * No SSE — just simple HTTP polling.
   */
  async pollForResult(
    jobId: string,
    options?: {
      onRetry?: (message: string) => void;
    },
  ): Promise<ExtractionResult> {
    let POLL_INTERVAL = 3_000;
    const MAX_ATTEMPTS = 30;
    const backgroundMessage =
      "It looks like it takes some time you can do someother work while the processing will be done and added in the purchase order page";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL);

      try {
        const status = await this.getExtractionResult(jobId);

        if (status.status === "COMPLETED" && status.result) {
          return status.result;
        }

        if (status.status === "RETRY") {
          POLL_INTERVAL = 30_000;
          options?.onRetry?.(status.message || backgroundMessage);
          continue;
        }

        if (status.status === "FAILED") {
          throw new Error(
            "Upload failed. Please try again later " 
          );
        }
      } catch (err) {
        // Only ignore transient HTTP/network issues while polling.
        if (!isAxiosError(err)) {
          throw err;
        }
      }
    }

    throw new BackgroundProcessingError(backgroundMessage);
  },

  async getPendingReviews(): Promise<PendingReviewsResponse> {
    try {
      const { data } = await api.get<PendingReviewsResponse>(
        ENDPOINTS.EXTRACTION.PENDING_REVIEW
      );
      return data;
    } catch {
      return { invoices: [], purchase_orders: [] };
    }
  },
};

