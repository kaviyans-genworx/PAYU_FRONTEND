import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthState, LoginCredentials } from "@/types/auth";
import { authService } from "@/features/auth/services/authService";
import { TOKEN_KEY } from "@/config/constants";

const initialState: AuthState = {
  accessToken: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  userId: null,
  roleId: null,
  isFirstLogin: false,
  isLoading: false,
  error: null,
};

// ---------- LOGIN ----------
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials.email, credentials.password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || "Login failed");
    }
  },
);

// ---------- FETCH CURRENT USER ----------
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.validateToken();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || "Session expired");
    }
  },
);

// ---------- LOGOUT ----------
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      localStorage.removeItem(TOKEN_KEY);
    } catch (error: unknown) {
      localStorage.removeItem(TOKEN_KEY);
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || "Logout failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    resetAuth(state) {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.userId = null;
      state.roleId = null;
      state.isFirstLogin = false;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access_token;
        state.isFirstLogin = action.payload.is_first_login;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.userId = action.payload.user_id;
        state.roleId = action.payload.role_id;
        state.isFirstLogin = action.payload.is_first_login;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.userId = null;
        state.roleId = null;
        state.isFirstLogin = false;
        localStorage.removeItem(TOKEN_KEY);
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.userId = null;
        state.roleId = null;
        state.isFirstLogin = false;
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.userId = null;
        state.roleId = null;
        state.isFirstLogin = false;
        state.isLoading = false;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
