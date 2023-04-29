import React from "react";
import ReactDOM from "react-dom/client";

import App from "../src/App";
import { getBaseURL } from "./utils";

console.log("Base url for iframe card:", `${window.location.origin}${getBaseURL(window.location)}?iframe`);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
