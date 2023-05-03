import {
  ChannelMode,
  HomeAssistantConnection,
  MobileNotificationBuilder,
} from "@famcomp/home-assistant";
import NotificationManager from ".";
import { AppState } from "../../types";
import { getTranslator } from "@famcomp/translations";
import Logger from "../../logger";
import { isTaskActive } from "@famcomp/common";
import dayjs from "dayjs";

jest.mock("@famcomp/common");
jest.mock("@famcomp/home-assistant");
jest.mock("../../logger");

describe("NotificationManager", () => {
  const connection = new HomeAssistantConnection("token234");
  let state: AppState = {
    tasks: [],
    persons: [],
  };
  const translator = getTranslator("en");
  const logger = new Logger();

  beforeEach(() => {
    jest.resetAllMocks();

    state = {
      tasks: [],
      persons: [],
    };

    (MobileNotificationBuilder.prototype.build as any).mockReturnValue({
      notification: "built",
    });
    (MobileNotificationBuilder.prototype.tag as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.action as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.channelMode as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.clear as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.message as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.persist as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.stick as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.target as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.title as any).mockReturnThis();
    (MobileNotificationBuilder.prototype.url as any).mockReturnThis();
  });
  it("Should instanciate the manager", () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger
    );

    expect(manager).toBeInstanceOf(NotificationManager);
    expect(connection.subscribeToEvent).toHaveBeenCalledTimes(2);
    expect(connection.subscribeToEvent).toHaveBeenNthCalledWith(
      1,
      "state_changed"
    );
    expect(connection.subscribeToEvent).toHaveBeenNthCalledWith(
      2,
      "mobile_app_notification_action"
    );
    expect(connection.on).toHaveBeenCalledTimes(2);
    expect((connection.on as any as jest.SpyInstance).mock.calls[0][0]).toBe(
      "state_changed"
    );
    expect((connection.on as any as jest.SpyInstance).mock.calls[1][0]).toBe(
      "mobile_app_notification_action"
    );
  });

  it("Should trigger entity state change and sync person task", () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      description: "This is a description",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    });
    (isTaskActive as any).mockReturnValue(true);

    new NotificationManager(connection, state, translator, logger);

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "person.test",
      new_state: {
        state: "Home",
      },
    });

    expect(isTaskActive).toHaveBeenCalledTimes(1);
    expect(isTaskActive).toHaveBeenCalledWith(state.tasks[0]);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledWith(
      "test"
    );
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledWith(
      "test_task"
    );
    expect(MobileNotificationBuilder.prototype.title).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.title).toHaveBeenCalledWith(
      "This is a label"
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledTimes(
      1
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledWith(
      "This is a description"
    );
    expect(MobileNotificationBuilder.prototype.persist).toHaveBeenCalledTimes(
      1
    );
    expect(MobileNotificationBuilder.prototype.persist).toHaveBeenCalledWith(
      true
    );
    expect(MobileNotificationBuilder.prototype.stick).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.stick).toHaveBeenCalledWith(
      true
    );
    expect(
      MobileNotificationBuilder.prototype.channelMode
    ).toHaveBeenCalledTimes(1);
    expect(
      MobileNotificationBuilder.prototype.channelMode
    ).toHaveBeenCalledWith(ChannelMode.Default);
    expect(MobileNotificationBuilder.prototype.url).toHaveBeenCalledTimes(0);
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenCalledTimes(2);
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenNthCalledWith(
      1,
      {
        action: "complete.test_task.jobId.test",
        title: "Done",
      }
    );
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenNthCalledWith(
      2,
      {
        action: "cancel.test_task.jobId.test",
        title: "Cancel",
      }
    );

    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledWith();
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });
  });

  it("Should pass down empty message when task has no description", () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    });
    (isTaskActive as any).mockReturnValue(true);

    new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "person.test",
      new_state: {
        state: "Home",
      },
    });

    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledTimes(
      1
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledWith(
      ""
    );
    expect(MobileNotificationBuilder.prototype.url).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.url).toHaveBeenCalledWith(
      "/notificationUrl/path"
    );
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });
  });

  it("Should send clear notification when task is not active", () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [],
      active: true,
    });
    (isTaskActive as any).mockReturnValue(false);

    new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "person.test",
      new_state: {
        state: "Home",
      },
    });

    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledWith();
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledWith(
      "test"
    );
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledWith(
      "test_task"
    );
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });
  });

  it("Should ignore when updated entity is not a person", () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [],
      active: true,
    });
    (isTaskActive as any).mockReturnValue(false);

    new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "other.test",
      new_state: {
        state: "Home",
      },
    });

    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(0);
  });
});
