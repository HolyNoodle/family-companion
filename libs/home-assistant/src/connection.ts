import { EventEmitter } from "stream";
import { MessageEvent, WebSocket } from "ws";
import { Person, WithId } from "@famcomp/common";

export type HomeAssistantMessageRaw<T> =
  | {
      type: "call_service";
      domain: string;
      service: string;
      service_data: T;
    }
  | {
      type: "get_states";
    }
  | {
      type: "get_config";
    }
  | {
      type: "fire_event";
      event_type: string;
      event_data?: {};
    }
  | {
      type: "subscribe_events";
      event_type: string;
    };
export type HomeAssistantResponse =
  | {
      id: number;
      type: "result";
      success: boolean;
      result: any;
    }
  | {
      type: "auth_required" | "auth_ok" | "auth_invalid";
    }
  | {
      type: "event";
      event: {
        context: any;
        event_type: string;
        data: {
          entity_id: string;
          new_state: {
            state: any;
          };
          old_state: {
            state: any;
          };
        };
      };
    };

export type HomeAssistantMessage<T> = HomeAssistantMessageRaw<T> &
  Partial<WithId<number>>;

export interface EntityState<State = any, Attributes = any> {
  entity_id: string;
  attributes: Attributes;
  state: State;
}

export class HomeAssistantConnection extends EventEmitter {
  private ws?: WebSocket;
  private ready = false;
  private lastId = 0;

  constructor(private token: string) {
    super();
  }

  async stop() {
    this.ws?.close();
    this.removeAllListeners();
  }

  async start() {
    const url = "ws://" + process.env.SUPERVISOR_URL! + "/websocket";

    console.log("Contacting Home Assistant instance", url);
    this.ws = new WebSocket(url);

    this.ws.onerror = (ex) => {
      console.error("Web socket error", ex);
    };

    let authPromiseResolver: Function;
    let authPromiseRejecter: Function;

    const promise = new Promise((resolve, reject) => {
      authPromiseResolver = resolve;
      authPromiseRejecter = reject;
    });

    this.ws.onopen = () => {
      this.ws!.onmessage = (message: MessageEvent) => {
        const event = JSON.parse(
          message.data.toString()
        ) as HomeAssistantResponse;
        if (event.type === "auth_required") {
          console.log("Sending home assistant auth");
          this.ws!.send(
            JSON.stringify({
              type: "auth",
              access_token: this.token,
            })
          );
        }

        if (event.type === "auth_ok") {
          console.log("Home assistant notification system is now ready");
          this.ready = true;
          
          this.ws!.onclose = (event) => {
            console.log("Websocket closing", event);
      
            this.ready = false;
            this.start();
          }

          authPromiseResolver!();
        }

        if (event.type === "auth_invalid") {
          authPromiseRejecter("Invalid auth");
        }

        if (event.type === "result") {
          this.emit(event.id + "", event.result);
        }

        if (event.type === "event") {
          this.emit(
            event.event.event_type,
            event.event.data,
            event.event.context.user_id
          );
        }
      };
    };

    return promise;
  }

  send<T = unknown>(message: HomeAssistantMessage<any>): Promise<T> {
    if (!this.ready) {
      return Promise.reject("Home assistant connection not ready yet.");
    }

    this.lastId++;
    const idMessage: HomeAssistantMessage<any> = {
      ...message,
      id: this.lastId,
    };

    this.ws!.send(JSON.stringify(idMessage));

    return new Promise((resolve) => {
      this.once(idMessage.id + "", resolve);
    });
  }

  getStates(type?: "person") {
    return this.send<EntityState[]>({
      type: "get_states",
    }).then((states) => {
      return type
        ? states.filter((entityState) => {
            return entityState.entity_id.startsWith(type);
          })
        : states;
    });
  }

  getConfig() {
    return this.send<EntityState[]>({
      type: "get_config",
    });
  }

  fireEvent(event: string, data?: {}) {
    this.send({
      type: "fire_event",
      event_type: event,
      event_data: data,
    });
  }

  subscribeToEvent(event: string) {
    this.send({
      type: "subscribe_events",
      event_type: event,
    });
  }

  async getPersons() {
    const entities = await this.getStates("person");

    return entities.map(
      (entity) =>
        ({
          id: entity.entity_id,
          internalId: entity.attributes.user_id,
          name: entity.attributes.friendly_name,
          isHome: (entity.state as string).toLocaleLowerCase() === "home",
        } as Person)
    );
  }
}
