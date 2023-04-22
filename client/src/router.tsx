import React from "react";
import {createBrowserRouter} from "react-router-dom";

import Week from "./domains/Job/views/Week";
import Feed from "./domains/Job/views/Feed";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Feed />
  },
  {
    path: "/week",
    element: <Week />
  }
]);

export default router;
