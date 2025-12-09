import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  favorites: [],
  listings: [],
  profile: null,
  cart: [],
  loaded: false,
};

const bootstrapSlice = createSlice({
  name: "bootstrap",
  initialState,
  reducers: {
    setBootstrapData(state, action) {
      state.favorites = action.payload?.favorites || [];
      state.listings = action.payload?.listings || [];
      state.profile = action.payload?.profile || null;
      state.loaded = true;
    },
    addFavorite(state, action) {
      if (!state.favorites.some(f => f.listingId === action.payload.listingId)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite(state, action) {
      state.favorites = state.favorites.filter(
        f => f.listingId !== action.payload
      );
    },
    resetBootstrap(state) {
      return initialState;
    }
  },
});

export const { setBootstrapData, addFavorite, removeFavorite, resetBootstrap } = bootstrapSlice.actions;
export default bootstrapSlice.reducer;
