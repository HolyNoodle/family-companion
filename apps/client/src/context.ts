import {getTranslator} from "@famcomp/translations";
import React from "react";
import { DateFormat } from "./utils";

export interface TranslatorContextType {
  translator: ReturnType<typeof getTranslator>;
  formatDate: (date: Date, format?: DateFormat) => string;
}
export const TranslatorContext = React.createContext<TranslatorContextType>({} as any);
