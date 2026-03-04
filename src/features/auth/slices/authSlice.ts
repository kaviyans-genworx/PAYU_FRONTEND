import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthState, LoginCredentials, RegisterCredentials } from "@/types/auth";
import { authService } from "@/features/auth/services/authService";
import { TOKEN_KEY } from "@/config/constants";

const initialState: AuthState = {
  accessToken: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error: null,
};

// ---------- LOGIN ----------
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(
        credentials.email,
        credentials.password,
      );
      localStorage.setItem(TOKEN_KEY, data.access_token);
      return data.access_token;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(
        err.response?.data?.detail || "Login failed",
      );
    }
  },
);

// ---------- REGISTER ----------
export const registerUser = createAsyncThunk(
  "auth/register",
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.register(
        credentials.name,
        credentials.email,
        credentials.password,
      );
      return data.message;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(
        err.response?.data?.detail || "Registration failed",
      );
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
      return rejectWithValue(
        err.response?.data?.detail || "Logout failed",
      );
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
        state.accessToken = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
