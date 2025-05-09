// src/store/walletSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  toName: "Select Token",
  toObjectId: "",
  fromBalance: 0,
  toBalance: 0,
  toDecimal: 0,
  fromName: "Select Token",
  fromDecimal: 0,
};

// Create slice for wallet address
const swapDetails = createSlice({
  name: "swap",
  initialState,
  reducers: {
    setTransactionData: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
});

// Export the actions
export const { setTransactionData } = swapDetails.actions;

// Export the reducer
export default swapDetails.reducer;
