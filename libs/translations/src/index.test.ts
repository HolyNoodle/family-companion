import { deserializeDate, getTranslator, interpolate, serializeDate } from ".";
import fr from "./translations/fr";
import en from "./translations/en";

describe("serializeDate", () => {
  it("Should serialize date to ISO string", () => {
    expect(serializeDate(new Date(Date.UTC(2023, 0, 1, 0, 0, 0)))).toBe(
      "2023-01-01T00:00:00.000Z"
    );
  });
});

describe("deserializeDate", () => {
  it("Should deserialize date from ISO string", () => {
    expect(deserializeDate("2023-01-01T00:00:00.000Z").toISOString()).toBe(
      "2023-01-01T00:00:00.000Z"
    );
  });
});

describe("interpolate", () => {
  it("Should return text", () => {
    expect(interpolate("this is a text")).toBe("this is a text");
  });
});

describe("getTranslator", () => {
  it("Should return en translator", () => {
    expect(getTranslator("en")).toStrictEqual({
      locale: "en",
      translations: en,
      interpolate
    })
  });

  it("Should return fr translator", () => {
    expect(getTranslator("fr")).toStrictEqual({
      locale: "fr",
      translations: fr,
      interpolate
    });
  });

  it("Should default to en translator when language not supported", () => {
    expect(getTranslator("uk" as any)).toStrictEqual({
      locale: "en",
      translations: en,
      interpolate
    });
  });
});