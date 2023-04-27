import React from "react";
import {usePerson} from "../state";
import Person from "../components/Person";

const PersonFromId = ({person}: {person: string}) => {
  const personObject = usePerson(person);

  if (!personObject) {
    return null;
  }

  return <Person person={personObject} />;
};

export default PersonFromId;
