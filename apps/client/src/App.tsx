import React from "react";
import {Provider} from "react-redux";

import "antd/dist/reset.css";
import "./style.css";

import store from "./store";
import {RouterProvider} from "react-router-dom";
import createRouter from "./router";

const App = () => {
  const router = createRouter();
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;
