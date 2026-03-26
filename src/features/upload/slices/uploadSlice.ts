import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { BackgroundProcessingError, extractionService } from "../services/extractionService";
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
  info: string | null;
  result: ExtractionResult | null;
  jobId: string | null;
}

const initialState: UploadState = {
  loading: false,
  error: null,
  info: null,
  result: loadResultFromStorage(),
  jobId: null,
};

interface UploadRejectValue {
  kind: "background" | "error";
  message: string;
}

export const extractPurchaseOrder = createAsyncThunk<
  ExtractionResult,
  { file: File },
  { rejectValue: UploadRejectValue }
>("upload/extractPurchaseOrder", async ({ file }, { rejectWithValue, dispatch }) => {
  try {
    const uploadResponse = await extractionService.uploadPurchaseOrder(file);
    dispatch(setJobId(uploadResponse.job_id));

    // Poll until extraction completes or fails
    const result = await extractionService.pollForResult(uploadResponse.job_id, {
      onRetry: (message) => {
        dispatch(setUploadInfo(message));
      },
    });
    return result;
  } catch (err: unknown) {
    if (err instanceof BackgroundProcessingError) {
      return rejectWithValue({ kind: "background", message: err.message });
    }

    if (err instanceof Error) {
      return rejectWithValue({ kind: "error", message: err.message || "Gemini OCR extraction failed." });
    }
    return rejectWithValue({ kind: "error", message: "Gemini OCR extraction failed." });
  }
});

export const checkBackgroundExtractionStatus = createAsyncThunk<
  void,
  { jobId: string }
>("upload/checkBackgroundExtractionStatus", async ({ jobId }, { dispatch }) => {
  try {
    const status = await extractionService.checkExtractionStatus(jobId);

    if (status.status === "COMPLETED" && status.result) {
      dispatch(restoreResult(status.result));
      return;
    }

    if (status.status === "FAILED") {
      dispatch(setUploadError(status.error || "Extraction failed. Please try again."));
      dispatch(setUploadInfo(null));
      return;
    }

    if (status.status === "RETRY") {
      dispatch(
        setUploadInfo(
          status.message ||
            "It looks like it takes some time you can do someother work while the processing will be done and added in the purchase order page",
        ),
      );
    }
  } catch {
    // Ignore transient polling issues for background monitor
  }
});

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    resetUpload(state) {
      state.loading = false;
      state.error = null;
      state.info = null;
      state.result = null;
      state.jobId = null;
      clearResultStorage();
      clearExtractionStep();
    },
    clearUploadError(state) {
      state.error = null;
    },
    setUploadError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearUploadInfo(state) {
      state.info = null;
    },
    setJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload;
    },
    setUploadInfo(state, action: PayloadAction<string | null>) {
      state.info = action.payload;
    },
    restoreResult(state, action: PayloadAction<ExtractionResult>) {
      state.loading = false;
      state.error = null;
      state.info = null;
      state.result = action.payload;
      saveResultToStorage(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extractPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.info = null;
        state.result = null;
        clearResultStorage();
      })
      .addCase(
        extractPurchaseOrder.fulfilled,
        (state, action: PayloadAction<ExtractionResult>) => {
          state.loading = false;
          state.error = null;
          state.info = null;
          state.result = action.payload;
          saveResultToStorage(action.payload);
          clearExtractionStep();
        },
      )
      .addCase(extractPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.kind === "background") {
          state.error = null;
          state.info = action.payload.message;
        } else {
          state.info = null;
          state.error = action.payload?.message ?? "Gemini OCR extraction failed.";
        }
        clearExtractionStep();
      });
  },
});

export const {
  resetUpload,
  clearUploadError,
  setUploadError,
  clearUploadInfo,
  restoreResult,
  setJobId,
  setUploadInfo,
} = uploadSlice.actions;
export default uploadSlice.reducer;

