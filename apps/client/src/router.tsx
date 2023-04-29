import React, {useMemo} from "react";
import {createBrowserRouter, useNavigate} from "react-router-dom";

import Feed from "./domains/Job/views/Feed";
import MainLayout from "./domains/Layout/components/MainLayout";
import TaskList from "./domains/Task/views/List";
import Dashboard from "./domains/Stats/views/Dashboard";
import TaskDetails from "./domains/Task/views/TaskDetails";
import TaskFormView from "./domains/Task/views/Form";
import { getBaseURL } from "./utils";

const router = () => {
  const basename = useMemo(() => getBaseURL(window.location), []);

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
              children: [
                {
                  index: true,
                  element: <TaskList />
                },
                {
                  path: ":id",
                  element: <TaskDetails />
                },
                {
                  path: "create",
                  element: <TaskFormView />
                }
              ]
            },
            {
              path: "dashboard",
              element: <Dashboard />
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
