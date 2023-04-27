import {createSlice, createAsyncThunk, createEntityAdapter, EntityState} from "@reduxjs/toolkit";
import api from "src/api";
import {RootState, useAppDispatch, useAppSelector} from "src/store";
import {Person, Stats} from "@famcomp/common";
import {useEffect} from "react";

export interface StatsState {
  status: "idle" | "pending" | "succeeded" | "failed";
  stats?: Stats;
}

export const initialState: Partial<StatsState> = {
  status: "idle"
};

const statsSlice = createSlice({
  name: "persons",
  initialState: initialState as StatsState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchStats.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(fetchStats.fulfilled, (state, action) => {
      state.status = "succeeded";

      state.stats = action.payload;
    });
    builder.addCase(fetchStats.rejected, (state) => {
      state.status = "failed";
    });
  }
});

export const fetchStats = createAsyncThunk("stats/fetch", () => {
  return api.getStats();
});

export default statsSlice;

export const selectStatsStatus = (state: RootState) => state.stats.status || "idle";
export const selectStats = (state: RootState) => state.stats.stats || {};

export const useStats = () => {
  const dispatch = useAppDispatch();

  const stats = useAppSelector(selectStats);
  const statsStatus = useAppSelector(selectStatsStatus);

  useEffect(() => {
    if (statsStatus === "idle") {
      dispatch(fetchStats());
    }
  }, [statsStatus]);

  return stats;
};
