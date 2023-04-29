import React, {useContext, useMemo} from "react";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js";
import {Doughnut} from "react-chartjs-2";
import {Person, Stats} from "@famcomp/common";
import {TranslatorContext} from "src/context";
import {Typography} from "antd";
import {COLORS} from "../constants";

ChartJS.register(ArcElement, Tooltip, Legend);

const Involvment = ({stats, persons}: {stats: Stats; persons: Person[]}) => {
  const {translator} = useContext(TranslatorContext);
  const data = useMemo(() => {
    const labels = [];
    const datasets = [
      {
        label: translator.translations.stats.involment,
        data: [],
        backgroundColor: COLORS
      }
    ];

    persons.forEach((p) => {
      labels.push(p.name);
      const stat = stats[p.id] ? Object.values(stats[p.id]).reduce((a, b) => a + b) : 0;
      datasets[0].data.push(stat);
    });

    return {labels, datasets};
  }, [stats, persons]);

  return (
    <>
      <Typography.Title level={2}>{translator.translations.stats.involment}</Typography.Title>
      <Doughnut
        data={{
          ...data
        }}
      />
    </>
  );
};

export default Involvment;
