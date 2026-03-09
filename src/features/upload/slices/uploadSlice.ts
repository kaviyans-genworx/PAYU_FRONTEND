import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { extractionService } from "../services/extractionService";
import type { ExtractionResult } from "../services/extractionService";

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
}

const initialState: UploadState = {
  loading: false,
  error: null,
  result: loadResultFromStorage(),
};

export const extractDocument = createAsyncThunk<
  ExtractionResult,
  { file: File; docType: "invoice" | "po" },
  { rejectValue: string }
>("upload/extractDocument", async ({ file, docType }, { rejectWithValue }) => {
  try {
    return await extractionService.extractDocument(file, docType);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      return rejectWithValue(
        axiosErr.response?.data?.detail || err.message,
      );
    }
    return rejectWithValue("Extraction failed");
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
      clearResultStorage();
    },
    clearUploadError(state) {
      state.error = null;
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
      .addCase(extractDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
        clearResultStorage();
      })
      .addCase(
        extractDocument.fulfilled,
        (state, action: PayloadAction<ExtractionResult>) => {
          state.loading = false;
          state.result = action.payload;
          saveResultToStorage(action.payload);
        },
      )
      .addCase(extractDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Extraction failed";
      });
  },
});

export const { resetUpload, clearUploadError, restoreResult } = uploadSlice.actions;
export default uploadSlice.reducer;
