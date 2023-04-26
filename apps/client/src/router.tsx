import React, {useMemo} from "react";
import {createBrowserRouter} from "react-router-dom";

import Week from "./domains/Job/views/Week";
import Feed from "./domains/Job/views/Feed";
import MainLayout from "./domains/Layout/components/MainLayout";
import TaskList from "./domains/Task/views/List";

const router = () => {
  const basename = useMemo(() => {
    const uri = window.location.pathname;
    const path = uri.split("/");

    if (uri.endsWith("dashboard") || uri.endsWith("week")) {
      return path.splice(path.length - 1, 1).join("/");
    }

    return path.join("/");
  }, []);

  const router = useMemo(() => {
    return createBrowserRouter(
      [
        {
          path: "/",
          element: <MainLayout />,
          children: [
            {
              index: true,
              element: <Feed />
            },
            {
              path: "tasks",
              element: <TaskList />
            }
          ]
        }
      ],
      {
        basename
      }
    );
  }, [basename]);

  return router;
};

export default router;
