import React, {useEffect} from "react";
import {fetchPersons, selectPerson, selectPersonsStatus} from "../state";
import {useAppDispatch, useAppSelector} from "src/store";
import Person from "../components/Person";

const PersonFromId = ({person}: {person: string}) => {
  const personObject = useAppSelector((state) => selectPerson(state, person));
  const personStatus = useAppSelector(selectPersonsStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (personStatus === "idle") {
      dispatch(fetchPersons());
    }
  }, [personStatus]);

  if(!personObject) {
    return null;
  }

  return <Person person={personObject} />;
};

export default PersonFromId;
