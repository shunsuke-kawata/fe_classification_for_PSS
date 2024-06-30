import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "@/lib/userReducer";
import { sidebarReducer } from "./sidebarReducer";

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      sidebar: sidebarReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const selectUser = (state: RootState) => state.user;
export const selectSidebar = (state: RootState) => state.sidebar;
