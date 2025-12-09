import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../services/api";

// ======================= ASYNC LOGOUT =======================
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, thunkAPI) => {
    try {
      // Gọi API logout
      await authApi.logout();
    } catch (err) {
      console.warn("Logout API error, vẫn tiếp tục xoá local:", err);
    }

    // Xoá tất cả token trong localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");

    return true;
  }
);

// ======================= AUTH SLICE =======================
const initialState = {
  token: localStorage.getItem("accessToken") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },

    setUser(state, action) {
      state.user = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setToken, setUser, clearAuth } = authSlice.actions;

export default authSlice.reducer;
