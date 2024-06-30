import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: boolean = false;

const sidebarSlice = createSlice({
  name: "sidebarSlice",
  initialState,
  reducers: {
    setSidebarStatus: (state, action: PayloadAction<boolean>) => {
      return action.payload;
    },
  },
});

export const { setSidebarStatus } = sidebarSlice.actions;
export const sidebarReducer = sidebarSlice.reducer;
