import React from "react";
import {selectAllTasks} from "src/domains/Task/state";
import PastJobs from "src/domains/Job/components/PastJobs";
import {useAppSelector} from "src/store";
import {useStats} from "../state";
import {usePersons} from "src/domains/Person/state";

const Dashboard = () => {
  const tasks = useAppSelector(selectAllTasks);
  const stats = useStats() || {};
  const persons = usePersons();

  return (
    <>
      {Object.keys(stats).map((personId) => {
        const person = persons.find((p) => p.id === personId);
        if(!person) {
          return null;
        }
        
        const personInvolments = Object.values(stats[personId]).reduce((a, b) => a + b);

        return (
          <span>
            {person.name}: {personInvolments}
          </span>
        );
      })}
      <PastJobs tasks={tasks} />
    </>
  );
};

export default Dashboard;
