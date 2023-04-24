import {createSlice, createAsyncThunk, createEntityAdapter, EntityState} from "@reduxjs/toolkit";
import dayjs from "dayjs";
import api from "src/api";
import {RootState} from "src/store";
import {Task, WithId} from "@famcomp/common";

export interface TaskState extends EntityState<Task> {
  status: "idle" | "pending" | "succeeded" | "failed";
}

export const initialState: Partial<TaskState> = {
  status: "idle"
};

const taskAdapter = createEntityAdapter<Task>({
  selectId: (item) => item.id,
  sortComparer: (a, b) => a.startDate.utcOffset() - b.startDate.utcOffset()
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
    startDate: dayjs(rawTask.startDate),
    jobs:
      rawTask.jobs?.map((j) => ({
        ...j,
        completionDate: j.completionDate ? dayjs(j.completionDate) : undefined,
        date: dayjs(j.date)
      })) || []
  }));
});

export default tasksSlice;

const tasksSelectors = taskAdapter.getSelectors<RootState>((state) => state.tasks);

export const selectAllTasks = tasksSelectors.selectAll;
export const selectTasksStatus = (state: RootState) => state.tasks.status || "idle";
