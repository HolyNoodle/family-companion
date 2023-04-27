import React from "react";
import {Person as PersonObject} from "@famcomp/common";

const Person = ({person}: {person: PersonObject}) => <span>{person.name}</span>;

export default Person;
