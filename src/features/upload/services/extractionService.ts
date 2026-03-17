import axios from "axios";
import { ENDPOINTS } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";

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

export interface ExtractionEventPayload {
  status?: "STARTED" | "COMPLETED" | "FAILED";
  step?: string;
  doc_type?: "po";
  result?: ExtractionResult;
  error?: string;
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

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const extractionService = {
  async uploadPurchaseOrder(file: File): Promise<ExtractionJobResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", "po");

    const { data } = await axios.post<ExtractionJobResponse>(
      ENDPOINTS.EXTRACTION.UPLOAD_PO,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...authHeaders(),
        },
      },
    );

    return data;
  },

  async getExtractionResult(jobId: string): Promise<ExtractionResultStatusResponse> {
    const { data } = await axios.get<ExtractionResultStatusResponse>(
      ENDPOINTS.EXTRACTION.RESULT(jobId),
      { headers: authHeaders() },
    );
    return data;
  },

  waitForExtractionCompletion(
    jobId: string,
    onEvent: (event: ExtractionEventPayload) => void,
  ): Promise<ExtractionResult> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(ENDPOINTS.EXTRACTION.EVENTS(jobId));
      let settled = false;
      let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

      const resetInactivityTimer = () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        inactivityTimer = setTimeout(async () => {
          try {
            const status = await extractionService.getExtractionResult(jobId);
            if (status.status === "COMPLETED" && status.result) {
              closeAndResolve(status.result);
              return;
            }
            if (status.status === "FAILED") {
              closeAndReject(new Error(status.error || "Extraction failed"));
              return;
            }
          } catch {
            // keep fallback error below
          }

          closeAndReject(
            new Error(
              "No extraction progress received from stream. Ensure PAYU_EXTRACTOR SSE service is running on port 8010.",
            ),
          );
        }, 25000);
      };

      const closeAndResolve = (result: ExtractionResult) => {
        if (settled) return;
        settled = true;
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        eventSource.close();
        resolve(result);
      };

      const closeAndReject = (error: Error) => {
        if (settled) return;
        settled = true;
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        eventSource.close();
        reject(error);
      };

      const handlePayload = (payload: ExtractionEventPayload) => {
        resetInactivityTimer();
        onEvent(payload);

        if (payload.status === "COMPLETED" && payload.result) {
          closeAndResolve(payload.result);
          return;
        }

        if (payload.status === "FAILED") {
          closeAndReject(new Error(payload.error || "Extraction failed"));
        }
      };

      const parseAndHandle = (raw: string) => {
        try {
          const payload = JSON.parse(raw) as ExtractionEventPayload;
          handlePayload(payload);
        } catch {
          closeAndReject(new Error("Invalid SSE payload received from extraction service"));
        }
      };

      eventSource.addEventListener("extraction_update", (event: MessageEvent<string>) => {
        parseAndHandle(event.data);
      });

      eventSource.onmessage = (event) => {
        parseAndHandle(event.data);
      };

      eventSource.onerror = async () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          try {
            const status = await extractionService.getExtractionResult(jobId);
            if (status.status === "COMPLETED" && status.result) {
              closeAndResolve(status.result);
              return;
            }
            if (status.status === "FAILED") {
              closeAndReject(new Error(status.error || "Extraction failed"));
              return;
            }
          } catch {
            // ignore and fallback to explicit error below
          }

          closeAndReject(
            new Error(
              "Connection to extraction progress stream closed. Ensure PAYU_EXTRACTOR SSE service is running on port 8010.",
            ),
          );
          return;
        }

        onEvent({ step: "reconnecting_stream" });
      };

      resetInactivityTimer();
    });
  },

  async getPendingReviews(): Promise<PendingReviewsResponse> {
    try {
      const { data } = await axios.get<PendingReviewsResponse>(
        ENDPOINTS.EXTRACTION.PENDING_REVIEW,
        { headers: authHeaders() },
      );
      return data;
    } catch {
      return { invoices: [], purchase_orders: [] };
    }
  },
};
