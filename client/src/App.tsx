import React from "react";
import {Provider} from "react-redux";

import "antd/dist/reset.css";

import Week from "./domains/Job/views/Week";
import store from "./store";

const App = () => (
  <Provider store={store}>
    <Week />
  </Provider>
);

export default App;
