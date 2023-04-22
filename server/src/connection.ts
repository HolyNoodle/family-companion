import { EventEmitter } from "stream";
import { MessageEvent, WebSocket } from "ws";
import { Person, WithId } from "./types";

export type HomeAssistantMessage<T> =
  | {
      type: "call_service";
      domain: string;
      service: string;
      service_data: T;
    }
  | {
      type: "get_states";
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
    };

export type NotificationInfo =
  | {
      message: string;
      title: string;
    }
  | {
      message: "clear_notification";
    };

export interface EntityState {
  entity_id: string;
  attributes: any;
  state: any;
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
    const url = process.env.SUPERVISOR_URL!;

    console.log("Contacting Home Assistant instance", url);

    this.ws = new WebSocket(url);

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
          authPromiseResolver!();
        }

        if (event.type === "auth_invalid") {
          authPromiseRejecter("Invalid auth");
        }

        if (event.type === "result") {
          // console.log("Received result", event);
          this.emit(event.id + "", event.result);
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
    const idMessage: WithId<HomeAssistantMessage<any>, number> = {
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

  async getPersons() {
    const entities = await this.getStates("person");

    return entities.map(
      (entity) =>
        ({
          id: entity.entity_id,
          name: entity.attributes.friendly_name,
          device: entity.attributes.source?.split(".")[1],
        } as Person)
    );
  }
}
