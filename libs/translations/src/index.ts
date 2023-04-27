import fr from "./translations/fr";
import en from "./translations/en";

export const SupportedLanguages = {
  en,
  fr,
};
export type SupportedLanguage = keyof typeof SupportedLanguages;
export const defaultLanguage: SupportedLanguage = "en";


export const serializeDate = (date: Date) => {
  return date.toISOString();
};

export const deserializeDate = (date: string) => {
  return new Date(date);
};

export const interpolate = (text: string, params?: {}) => {
  return text;
};

export const getTranslator = (locale: SupportedLanguage) => {
  const translations =
    SupportedLanguages[locale] || SupportedLanguages[defaultLanguage];

  return {
    locale,
    translations,
    interpolate,
  };
};
