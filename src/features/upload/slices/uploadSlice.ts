import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { extractionService } from "../services/extractionService";
import type { ExtractionResult } from "../services/extractionService";

interface UploadState {
  loading: boolean;
  error: string | null;
  result: ExtractionResult | null;
}

const initialState: UploadState = {
  loading: false,
  error: null,
  result: null,
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
    },
    clearUploadError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extractDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
      })
      .addCase(
        extractDocument.fulfilled,
        (state, action: PayloadAction<ExtractionResult>) => {
          state.loading = false;
          state.result = action.payload;
        },
      )
      .addCase(extractDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Extraction failed";
      });
  },
});

export const { resetUpload, clearUploadError } = uploadSlice.actions;
export default uploadSlice.reducer;
