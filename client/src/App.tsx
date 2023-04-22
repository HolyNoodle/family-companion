import React from "react";
import {Provider} from "react-redux";

import "antd/dist/reset.css";

import store from "./store";
import {RouterProvider} from "react-router-dom";
import router from "./router";
import MainLayout from "./domains/Layout/components/MainLayout";

const App = () => (
  <Provider store={store}>
    <MainLayout>
      <RouterProvider router={router} />
    </MainLayout>
  </Provider>
);

export default App;
