import {createSlice, createAsyncThunk, createEntityAdapter, EntityState} from "@reduxjs/toolkit";
import api from "src/api";
import { RootState } from "src/store";
import {Task, WithId} from "src/types";

export interface TaskState extends EntityState<WithId<Task>> {
  status: "idle" | "pending" | "succeeded" | "failed";
}

export const initialState: Partial<TaskState> = {
  status: "idle"
};

const taskAdapter = createEntityAdapter<WithId<Task>>({
  selectId: (item) => item.id,
  sortComparer: (a, b) => a.startDate.getTime() - b.startDate.getTime()
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState: {...taskAdapter.getInitialState(), ...initialState},
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchTasks.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.status = "succeeded";

      taskAdapter.setAll(state, action.payload);
    });
    builder.addCase(fetchTasks.rejected, (state) => {
      state.status = "failed";
    });
  }
});

export const fetchTasks = createAsyncThunk("tasks/fetch", async () => {
  const rawTasks = await api.getTasks();

  return rawTasks.map((rawTask) => ({
    ...rawTask,
    startDate: new Date(rawTask.startDate)
  }));
});

export default tasksSlice;

const tasksSelectors = taskAdapter.getSelectors<RootState>(state => state.tasks);

export const selectAllTasks = tasksSelectors.selectAll;
export const selectTasksStatus = (state: RootState) => state.tasks.status || "idle";