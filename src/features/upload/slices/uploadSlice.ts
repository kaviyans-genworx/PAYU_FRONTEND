import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { extractionService } from "../services/extractionService";
import type { ExtractionResult } from "../services/extractionService";
import { clearExtractionStep } from "../components/UploadPage";

/* ---- sessionStorage helpers for surviving page refresh ---- */

const RESULT_KEY = "payu_extraction_result";

function saveResultToStorage(result: ExtractionResult) {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch { /* quota errors – ignore */ }
}

function loadResultFromStorage(): ExtractionResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as ExtractionResult) : null;
  } catch {
    return null;
  }
}

function clearResultStorage() {
  sessionStorage.removeItem(RESULT_KEY);
}

/* ---- slice state ---- */

interface UploadState {
  loading: boolean;
  error: string | null;
  result: ExtractionResult | null;
  jobId: string | null;
}

const initialState: UploadState = {
  loading: false,
  error: null,
  result: loadResultFromStorage(),
  jobId: null,
};

export const extractPurchaseOrder = createAsyncThunk<
  ExtractionResult,
  { file: File },
  { rejectValue: string }
>("upload/extractPurchaseOrder", async ({ file }, { rejectWithValue, dispatch }) => {
  try {
    const uploadResponse = await extractionService.uploadPurchaseOrder(file);
    dispatch(setJobId(uploadResponse.job_id));

    // Poll until extraction completes or fails
    const result = await extractionService.pollForResult(uploadResponse.job_id);
    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Gemini OCR") || err.message.includes("timeout")) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue("Gemini OCR extraction failed. Please try again.");
    }
    return rejectWithValue("Gemini OCR extraction failed.");
  }
});

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    resetUpload(state) {
      state.loading = false;
      state.error = null;
      state.result = null;
      state.jobId = null;
      clearResultStorage();
      clearExtractionStep();
    },
    clearUploadError(state) {
      state.error = null;
    },
    setJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload;
    },
    restoreResult(state, action: PayloadAction<ExtractionResult>) {
      state.loading = false;
      state.error = null;
      state.result = action.payload;
      saveResultToStorage(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extractPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
        clearResultStorage();
      })
      .addCase(
        extractPurchaseOrder.fulfilled,
        (state, action: PayloadAction<ExtractionResult>) => {
          state.loading = false;
          state.result = action.payload;
          saveResultToStorage(action.payload);
          clearExtractionStep();
        },
      )
      .addCase(extractPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Gemini OCR extraction failed.";
        clearExtractionStep();
      });
  },
});

export const {
  resetUpload,
  clearUploadError,
  restoreResult,
  setJobId,
} = uploadSlice.actions;
export default uploadSlice.reducer;

