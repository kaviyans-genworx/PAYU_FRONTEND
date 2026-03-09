import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { extractionService } from "@/features/upload/services/extractionService";
import type { ExtractionResult } from "@/features/upload/services/extractionService";

const STORAGE_KEY = "payu_pending_reviews";

function saveToStorage(items: ExtractionResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota — ignore */ }
}

function loadFromStorage(): ExtractionResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExtractionResult[]) : [];
  } catch {
    return [];
  }
}

interface ReviewState {
  items: ExtractionResult[];
  loading: boolean;
  fetched: boolean;
}

const stored = loadFromStorage();

const initialState: ReviewState = {
  items: stored,
  loading: false,
  fetched: stored.length > 0,
};

export const fetchPendingReviews = createAsyncThunk<
  ExtractionResult[],
  void,
  { rejectValue: string }
>("review/fetchPendingReviews", async (_, { rejectWithValue }) => {
  try {
    const data = await extractionService.getPendingReviews();
    return [
      ...data.invoices,
      ...data.purchase_orders,
    ];
  } catch {
    return rejectWithValue("Failed to fetch pending reviews");
  }
});

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    addReviewItem(state, action: PayloadAction<ExtractionResult>) {
      const item = action.payload;
      const id = item.stored_record?.id;
      const type = item.document_type;
      if (id && !state.items.some(
        (i) => i.stored_record?.id === id && i.document_type === type,
      )) {
        state.items.push(item);
      }
      saveToStorage(state.items);
    },
    removeReviewItem(
      state,
      action: PayloadAction<{ id: number; document_type: string }>,
    ) {
      state.items = state.items.filter(
        (i) =>
          !(
            i.stored_record?.id === action.payload.id &&
            i.document_type === action.payload.document_type
          ),
      );
      saveToStorage(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchPendingReviews.fulfilled,
        (state, action: PayloadAction<ExtractionResult[]>) => {
          state.loading = false;
          state.fetched = true;
          for (const item of action.payload) {
            const id = item.stored_record?.id;
            const type = item.document_type;
            if (id && !state.items.some(
              (i) => i.stored_record?.id === id && i.document_type === type,
            )) {
              state.items.push(item);
            }
          }
          saveToStorage(state.items);
        },
      )
      .addCase(fetchPendingReviews.rejected, (state) => {
        state.loading = false;
        state.fetched = true;
      });
  },
});

export const { addReviewItem, removeReviewItem } = reviewSlice.actions;
export default reviewSlice.reducer;
