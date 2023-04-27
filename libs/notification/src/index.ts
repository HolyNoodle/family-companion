import { HomeAssistantMessage } from "@famcomp/home-assistant";

export type NotificationAction =
  | {
      action: "URI";
      title: string;
      uri: string;
    }
  | {
      action: "REPLY";
      title: string;
    }
  | { action: string; title: string };

export interface NotificationData {
  persistent?: boolean;
  sticky?: boolean;
  tag?: string;
  channel?: string;
  mode?: "default" | "low" | "high" | "min" | "max";
  actions?: NotificationAction[];
}

export interface NotificationInfo {
  message: string;
  title?: string;
  data?: NotificationData;
}

export enum ChannelMode {
  Critical = "FC_Critical",
  Default = "General",
  Action = "FC_Action",
}

const channelCriticity: { [key in ChannelMode]: NotificationData["mode"] } = {
  [ChannelMode.Critical]: "max",
  [ChannelMode.Default]: "high",
  [ChannelMode.Action]: "min",
};

export class MobileNotificationBuilder {
  private data: NotificationInfo;
  private mobileId?: string;
  private tagId?: string;
  private actions: NotificationAction[];
  private persistent?: boolean;
  private sticky?: boolean;
  private channel: ChannelMode = ChannelMode.Default;

  constructor() {
    this.data = {} as any;
    this.actions = [];
  }

  clear() {
    this.data.message = "clear_notification";
    return this;
  }

  title(title: string) {
    this.data.title = title;
    return this;
  }
  message(message: string) {
    this.data.message = message;
    return this;
  }
  target(target: string) {
    this.mobileId = target;
    return this;
  }
  tag(tag: string) {
    this.tagId = tag;
    return this;
  }
  persist(persistent: boolean) {
    this.persistent = persistent;
    return this;
  }
  stick(sticky: boolean) {
    this.sticky = sticky;
    return this;
  }
  action(action: NotificationAction) {
    this.actions.push(action);
    return this;
  }
  channelMode(mode: ChannelMode) {
    this.channel = mode;
    return this;
  }

  build(): HomeAssistantMessage<NotificationInfo> {
    return {
      type: "call_service",
      domain: "notify",
      service: "mobile_app_" + this.mobileId,
      service_data: {
        ...this.data,
        data: {
          channel: this.channel,
          mode: channelCriticity[this.channel],
          persistent: this.persistent,
          sticky: this.sticky,
          tag: this.tagId,
          actions: this.actions.length ? this.actions : undefined,
        },
      },
    };
  }
}
