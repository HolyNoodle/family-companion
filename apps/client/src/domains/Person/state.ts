import {createSlice, createAsyncThunk, createEntityAdapter, EntityState} from "@reduxjs/toolkit";
import api from "src/api";
import {RootState} from "src/store";
import {Person} from "@famcomp/common";

export interface PersonState extends EntityState<Person> {
  status: "idle" | "pending" | "succeeded" | "failed";
}

export const initialState: Partial<PersonState> = {
  status: "idle"
};

const personAdapter = createEntityAdapter<Person>({
  selectId: (item) => item.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

const personsSlice = createSlice({
  name: "persons",
  initialState: {...personAdapter.getInitialState(), ...initialState},
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchPersons.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(fetchPersons.fulfilled, (state, action) => {
      state.status = "succeeded";

      personAdapter.setAll(state, action.payload);
    });
    builder.addCase(fetchPersons.rejected, (state) => {
      state.status = "failed";
    });
  }
});

export const fetchPersons = createAsyncThunk("persons/fetch", () => {
  return api.getPersons();
});

export default personsSlice;

const tasksSelectors = personAdapter.getSelectors<RootState>((state) => state.persons);

export const selectAllPersons = tasksSelectors.selectAll;
export const selectPerson = tasksSelectors.selectById;
export const selectPersonsStatus = (state: RootState) => state.persons.status || "idle";
