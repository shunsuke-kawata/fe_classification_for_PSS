import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface LoginUserState {
  id: number | null;
  name: string;
  email: string;
  authority: boolean;
}

//ユーザ情報の初期値
const initialState: LoginUserState = {
  id: null,
  name: "",
  email: "",
  authority: false,
};

const loginuserSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setLoginedUser: (state, action: PayloadAction<LoginUserState>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.authority = action.payload.authority;
    },
  },
});

export const { setLoginedUser } = loginuserSlice.actions;
export const userReducer = loginuserSlice.reducer;
