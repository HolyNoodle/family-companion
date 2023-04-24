import {configureStore} from "@reduxjs/toolkit";
import tasksSlice from "./domains/Task/state";
import {useDispatch} from "react-redux";

const store = configureStore({
  reducer: {
    tasks: tasksSlice.reducer
  }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
