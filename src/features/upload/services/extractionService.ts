import axios from "axios";
import { ENDPOINTS } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";

export interface ExtractionResult {
  document_type: "invoice" | "po";
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

export interface PendingReviewsResponse {
  invoices: ExtractionResult[];
  purchase_orders: ExtractionResult[];
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const extractionService = {
  async extractDocument(
    file: File,
    docType: "invoice" | "po",
  ): Promise<ExtractionResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    try {
      const { data } = await axios.post<ExtractionResult>(
        ENDPOINTS.EXTRACTION.EXTRACT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...authHeaders(),
          },
        },
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        return { ...err.response.data, duplicate: true };
      }
      throw err;
    }
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
