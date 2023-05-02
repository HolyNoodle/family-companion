import { WebSocket } from "ws";
import { HomeAssistantConnection, HomeAssistantMessage } from "./connection";

process.env.SUPERVISOR_URL = "test.url:4321";
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

  it("Should close connection", async () => {
    const connection = new HomeAssistantConnection("123token");

    const startPromise = connection.start();

    expect(connection["ws"]).toBeInstanceOf(WebSocket);

    const ws = connection["ws"];

    ws!.onopen!(undefined as any);

    ws!.onmessage!({
      data: Buffer.from(JSON.stringify({ type: "auth_ok" })),
    } as any);

    await startPromise;

    await connection.stop();

    expect(ws!.close).toHaveBeenCalledTimes(1);
  });

  it("Should close connection when not initialized", async () => {
    const connection = new HomeAssistantConnection("123token");

    await expect(connection.stop()).resolves.toBeUndefined();
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

    await expect(startPromise).resolves.toBeUndefined();
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

    await expect(startPromise).rejects.toBe("Invalid auth");
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

  it("Should send message to home assistant", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    const message = { id: 1 } as any as HomeAssistantMessage<any>;
    const sendPromise = connection.send(message);

    ws!.onmessage!({
      data: Buffer.from(
        JSON.stringify({
          type: "result",
          id: 1,
          result: { test: "name" },
        })
      ),
    } as any);

    await expect(sendPromise).resolves.toStrictEqual({
      test: "name",
    });
  });

  it("Should not send message to home assistant when not ready", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const message = {} as HomeAssistantMessage<any>;
    const sendPromise = connection.send(message);

    await expect(sendPromise).rejects.toBe(
      "Home assistant connection not ready yet."
    );
  });

  it("Should send message with next id to home assistant when id is not present", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    const message = {} as HomeAssistantMessage<any>;
    connection.send(message);

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({
        id: 1,
      })
    );
  });

  it("Should get states from HA", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    const sendPromise = connection.getStates();

    ws!.onmessage!({
      data: Buffer.from(
        JSON.stringify({
          type: "result",
          id: 1,
          result: [{ test: "name" }],
        })
      ),
    } as any);

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_states", id: 1 })
    );

    await expect(sendPromise).resolves.toStrictEqual([
      {
        test: "name",
      },
    ]);
  });


  it("Should get config from HA", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    const sendPromise = connection.getConfig();

    ws!.onmessage!({
      data: Buffer.from(
        JSON.stringify({
          type: "result",
          id: 1,
          result: [{ test: "name" }],
        })
      ),
    } as any);

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_config", id: 1 })
    );

    await expect(sendPromise).resolves.toStrictEqual([
      {
        test: "name",
      },
    ]);
  });

  it("Should fire event in HA", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    connection.fireEvent("event_name", { test: "data" });

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "fire_event",
        event_type: "event_name",
        event_data: { test: "data" },
        id: 1,
      })
    );
  });


  it("Should subscribe to event in HA", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    connection.subscribeToEvent("event_name");

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "subscribe_events",
        event_type: "event_name",
        id: 1,
      })
    );
  });

  it("Should get persons from HA", async () => {
    const connection = new HomeAssistantConnection("123token");

    connection.start();

    const ws = connection["ws"];
    ws!.onopen!(undefined as any);

    connection["ready"] = true;

    const sendPromise = connection.getPersons();

    ws!.onmessage!({
      data: Buffer.from(
        JSON.stringify({
          type: "result",
          id: 1,
          result: [
            {
              entity_id: "person.name",
              state: "home",
              attributes: {
                friendly_name: "My Name",
                user_id: "internal id",
              },
            },
            {
              entity_id: "person.name2",
              state: "not_home",
              attributes: {
                friendly_name: "My Name2",
                user_id: "internal id2",
              },
            },
            { entity_id: "not_person.name" },
          ],
        })
      ),
    } as any);

    expect(ws!.send).toHaveBeenCalledTimes(1);
    expect(ws!.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_states", id: 1 })
    );

    await expect(sendPromise).resolves.toStrictEqual([
      {
        id: "person.name",
        name: "My Name",
        internalId: "internal id",
        isHome: true,
      },
      {
        id: "person.name2",
        name: "My Name2",
        internalId: "internal id2",
        isHome: false,
      },
    ]);
  });
});
