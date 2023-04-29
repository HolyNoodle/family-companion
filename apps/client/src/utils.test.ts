import { getBaseURL } from "./utils"

describe("getBaseURL", () => {
  it("Should return / when localhost:8080", () => {
    expect(getBaseURL({
      host: "localhost:8080",
      pathname: "/dashboard"
    } as Location)).toBe("/");
  });
  it("Should return ingress base url when home assistant url", () => {
    expect(getBaseURL({
      host: "192.168.1.2:8123",
      pathname: "/api/hassio_ingress/ci_eI5wnw-zskQPw5qxIo0crbP0UiYmiArYJQrKbyVE/dashboard"
    } as Location)).toBe("/api/hassio_ingress/ci_eI5wnw-zskQPw5qxIo0crbP0UiYmiArYJQrKbyVE/");
  });
})