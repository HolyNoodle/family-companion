import React, {useMemo} from "react";
import {Provider} from "react-redux";

import "antd/dist/reset.css";
import "./style.css";

import store from "./store";
import {RouterProvider} from "react-router-dom";
import createRouter from "./router";

import {SupportedLanguage, getTranslator} from "@famcomp/translations";
import {TranslatorContext, TranslatorContextType} from "./context";
import {formatDate} from "./utils";

const App = () => {
  const translatorContext = useMemo(() => {
    const translator = getTranslator(navigator.language.split("-")[0] as SupportedLanguage);

    return {
      translator,
      formatDate: formatDate(translator.locale as SupportedLanguage)
    } as TranslatorContextType;
  }, [navigator.language]);

  const router = createRouter();

  return (
    <TranslatorContext.Provider value={translatorContext}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </TranslatorContext.Provider>
  );
};

export default App;
