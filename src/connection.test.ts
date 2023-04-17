import { WebSocket } from "ws";
import { HomeAssistantConnection } from "./connection";

jest.mock("ws");

describe("HomeAssistantConnection", () => {
  it("Should instanciate HomeAssistantConnection", () => {
    const connection = new HomeAssistantConnection("123token");

    expect(connection).toBeInstanceOf(HomeAssistantConnection);
  });

  it("Should send token to home assistant", () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    expect(connection["ws"]).toBeInstanceOf(WebSocket);

    const ws = connection["ws"];

    ws!.onopen!(undefined as any);

    ws!.onmessage!({
      data: Buffer.from(JSON.stringify({ type: "auth_required" })),
    } as any);

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "auth",
        access_token: "123token",
      })
    );
  });

  it("Should resolve start when home assistant validate auth", async () => {
    const connection = new HomeAssistantConnection("123token");

    const startPromise = connection.start();

    expect(connection["ws"]).toBeInstanceOf(WebSocket);

    const ws = connection["ws"];

    ws!.onopen!(undefined as any);

    ws!.onmessage!({
      data: Buffer.from(JSON.stringify({ type: "auth_ok" })),
    } as any);

    expect(startPromise).resolves.toBeUndefined();
  });

  it("Should reject start when home assistant invalidate auth", async () => {
    const connection = new HomeAssistantConnection("123token");

    const startPromise = connection.start();

    expect(connection["ws"]).toBeInstanceOf(WebSocket);

    const ws = connection["ws"];

    ws!.onopen!(undefined as any);

    ws!.onmessage!({
      data: Buffer.from(JSON.stringify({ type: "auth_invalid" })),
    } as any);

    expect(startPromise).rejects.toBe("Invalid auth");
  });

  it("Should emit event when result is received", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const eventSpy = jest.fn();
    connection.addListener("123Message", eventSpy);

    expect(connection["ws"]).toBeInstanceOf(WebSocket);

    const ws = connection["ws"];

    ws!.onopen!(undefined as any);

    ws!.onmessage!({
      data: Buffer.from(
        JSON.stringify({
          type: "result",
          id: "123Message",
          result: { test: "name" },
        })
      ),
    } as any);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith({ test: "name" });
  });
});
