import {createSlice, createAsyncThunk, createEntityAdapter, EntityState} from "@reduxjs/toolkit";
import api from "src/api";
import {RootState, useAppDispatch, useAppSelector} from "src/store";
import {Person} from "@famcomp/common";
import {useEffect} from "react";

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

const personsSelectors = personAdapter.getSelectors<RootState>((state) => state.persons);

export const selectAllPersons = personsSelectors.selectAll;
export const selectPerson = personsSelectors.selectById;
export const selectPersonsStatus = (state: RootState) => state.persons.status || "idle";

export const usePersons = () => {
  const dispatch = useAppDispatch();

  const persons = useAppSelector(selectAllPersons);
  const personsStatus = useAppSelector(selectPersonsStatus);

  useEffect(() => {
    if (personsStatus === "idle") {
      dispatch(fetchPersons());
    }
  }, [personsStatus]);

  return persons;
};
export const usePerson = (id: string) => {
  usePersons();
  return useAppSelector((state) => selectPerson(state, id));
};
