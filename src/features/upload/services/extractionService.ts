import api from "@/lib/axios";
import { ENDPOINTS } from "@/config/env";

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
  status: "PENDING" | "COMPLETED" | "FAILED";
  result?: ExtractionResult;
  error?: string;
}

export interface PendingReviewsResponse {
  invoices: ExtractionResult[];
  purchase_orders: ExtractionResult[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  /**
   * Polls the result endpoint every 2s until COMPLETED or FAILED.
   * No SSE — just simple HTTP polling.
   */
  async pollForResult(jobId: string): Promise<ExtractionResult> {
    const POLL_INTERVAL = 2_000;
    const MAX_ATTEMPTS = 20; // 40 seconds max

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL);

      try {
        const status = await this.getExtractionResult(jobId);

        if (status.status === "COMPLETED" && status.result) {
          return status.result;
        }

        if (status.status === "FAILED") {
          throw new Error(
            status.error || "Gemini OCR extraction failed.",
          );
        }
      } catch (err) {
        // Re-throw known extraction errors
        if (err instanceof Error && err.message.includes("Gemini OCR")) {
          throw err;
        }
        // Network blip — keep polling
      }
    }

    throw new Error("The extraction is taking longer than expected. Please feel free to do other work while this processes. You can view the document later in the Purchase Orders page with an 'Under Review' status once processing completes.");
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

