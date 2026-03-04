import axios from "axios";
import { ENDPOINTS } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";

export interface ExtractionResult {
  document_type: "invoice" | "po";
  extracted_data: Record<string, unknown>;
  message?: string;
  duplicate?: boolean;
}

export const extractionService = {
  async extractDocument(
    file: File,
    docType: "invoice" | "po",
  ): Promise<ExtractionResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    const token = localStorage.getItem(TOKEN_KEY);

    try {
      const { data } = await axios.post<ExtractionResult>(
        ENDPOINTS.EXTRACTION.EXTRACT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
};
