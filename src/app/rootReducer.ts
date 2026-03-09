import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { uploadReducer } from "@/features/upload";
import reviewReducer from "@/features/review/slices/reviewSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  upload: uploadReducer,
  review: reviewReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
