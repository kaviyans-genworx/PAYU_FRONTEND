import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { uploadReducer } from "@/features/upload";

const rootReducer = combineReducers({
  auth: authReducer,
  upload: uploadReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
