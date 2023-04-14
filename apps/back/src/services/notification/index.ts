import { HomeAssistantNotificationProvider } from "./HomeAssistantNotificationProvider";
import { NotificationProvider, RuntimeEnv } from "./types";

export class NotificationServiceProxy {
  public static get(env: RuntimeEnv): NotificationProvider | null {
    if (env === RuntimeEnv.HomeAssistantAddOn) {
      if (!process.env.SUPERVISOR_TOKEN) {
        throw new Error("SUPERVISOR_TOKEN missing from environment");
      }

      return new HomeAssistantNotificationProvider(
        process.env.SUPERVISOR_TOKEN
      );
    }

    return null;
  }
}
