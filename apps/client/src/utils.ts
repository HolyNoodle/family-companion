import {SupportedLanguage} from "@famcomp/translations";
import dayjs from "dayjs";

export interface AsyncAPIDataState<T> {
  loading: boolean;
  invalid: boolean;
  success?: boolean;
  error?: string;
  data?: T;
}

export enum DateFormat {
  SHORT_DATE,
  LONG_DATE,
  TIME
}

const formatters: {
  [key in DateFormat]: (locale: SupportedLanguage) => string;
} = {
  [DateFormat.LONG_DATE]: (locale: SupportedLanguage) => (locale === "fr" ? "dddd DD MMMM" : "LL"),
  [DateFormat.SHORT_DATE]: () => "L",
  [DateFormat.TIME]: () => "LT"
};

require("dayjs/locale/en");
require("dayjs/locale/fr");

export const formatDate = (locale: SupportedLanguage) => {
  return (date: Date, format = DateFormat.SHORT_DATE) => {
    return dayjs(date).locale(locale).format(formatters[format](locale));
  };
};

export const getBaseURL = (location: Location) => {
  if (location.pathname.indexOf("hassio_ingress") > -1) {
    const uri = location.pathname;
    const path = uri.split("/");

    const index = path.findIndex((s) => s.indexOf("hassio_ingress") > -1);

    const pathElements = path.slice(0, index + 2);

    return pathElements.join("/") + "/";
  }

  return "/";
};
