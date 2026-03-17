import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { extractionService } from "../services/extractionService";
import type { ExtractionEventPayload, ExtractionResult } from "../services/extractionService";

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
  currentStep: string | null;
  events: ExtractionEventPayload[];
}

const initialState: UploadState = {
  loading: false,
  error: null,
  result: loadResultFromStorage(),
  jobId: null,
  currentStep: null,
  events: [],
};

export const extractPurchaseOrder = createAsyncThunk<
  ExtractionResult,
  { file: File },
  { rejectValue: string }
>("upload/extractPurchaseOrder", async ({ file }, { rejectWithValue, dispatch }) => {
  try {
    const uploadResponse = await extractionService.uploadPurchaseOrder(file);
    dispatch(setJobId(uploadResponse.job_id));

    const result = await extractionService.waitForExtractionCompletion(
      uploadResponse.job_id,
      (event) => {
        dispatch(pushExtractionEvent(event));
      },
    );

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      const axiosErr = err as { response?: { data?: { detail?: string; message?: string } } };
      return rejectWithValue(
        axiosErr.response?.data?.detail || axiosErr.response?.data?.message || err.message,
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
      state.jobId = null;
      state.currentStep = null;
      state.events = [];
      clearResultStorage();
    },
    clearUploadError(state) {
      state.error = null;
    },
    setJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload;
    },
    pushExtractionEvent(state, action: PayloadAction<ExtractionEventPayload>) {
      state.events.push(action.payload);
      if (action.payload.step) {
        state.currentStep = action.payload.step;
      }
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
        state.currentStep = null;
        state.events = [];
        clearResultStorage();
      })
      .addCase(
        extractPurchaseOrder.fulfilled,
        (state, action: PayloadAction<ExtractionResult>) => {
          state.loading = false;
          state.result = action.payload;
          state.currentStep = "completed";
          saveResultToStorage(action.payload);
        },
      )
      .addCase(extractPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Extraction failed";
      });
  },
});

export const {
  resetUpload,
  clearUploadError,
  restoreResult,
  setJobId,
  pushExtractionEvent,
} = uploadSlice.actions;
export default uploadSlice.reducer;
