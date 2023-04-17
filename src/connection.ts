import { EventEmitter } from "stream";
import { ErrorEvent, MessageEvent, WebSocket } from "ws";

export interface HomeAssistantMessage<T> {
  id?: number;
  type: "call_service";
  domain: "notification";
  service: "notify.ALL_DEVICES";
  service_data: T;
}
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
    this.ws = new WebSocket("ws://supervisor/core/websocket");

    let authPromiseResolver: Function;
    let authPromiseRejecter: Function;

    const promise = new Promise((resolve, reject) => {
      authPromiseResolver = resolve;
      authPromiseRejecter = reject;
    });

    this.ws.onopen = () => {
      this.ws!.onmessage = (message: MessageEvent) => {
        const event = JSON.parse(message.data.toString()) as HomeAssistantResponse;
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
          authPromiseResolver!();
        }

        if(event.type === "auth_invalid") {
          authPromiseRejecter("Invalid auth");
        }

        if (event.type === "result") {
          this.emit(event.id + "", event.result);
        }
      };
    };

    return promise;
  }

  send(message: HomeAssistantMessage<any>) {
    if (!this.ready) {
      return Promise.reject("Home assistant connection not ready yet.");
    }

    if (!message.id) {
      this.lastId++;
      message.id = this.lastId;
    }

    this.ws!.send(JSON.stringify(message));

    return new Promise((resolve) => {
      this.once(message.id + "", resolve);
    });
  }
}
