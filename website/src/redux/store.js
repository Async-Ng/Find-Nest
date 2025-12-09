import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import bootstrapReducer from "./slices/bootstrapSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    bootstrap: bootstrapReducer
  },
});

export default store;
