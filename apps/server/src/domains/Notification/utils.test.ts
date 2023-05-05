import {
  ChannelMode,
  HomeAssistantConnection,
  MobileNotificationBuilder,
} from "@famcomp/home-assistant";
import { getTranslator } from "@famcomp/translations";
import Logger from "../../logger";
import { Person, Task, isTaskActive } from "@famcomp/common";
import dayjs from "dayjs";
import {
  cleanUnknownTask,
  createQuickActionNotificationAction,
  syncPersonTask,
} from "./utils";

jest.mock("@famcomp/common");
jest.mock("@famcomp/home-assistant");
jest.mock("../../logger");

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

(HomeAssistantConnection.prototype.send as any).mockResolvedValue({
  result: true,
});

describe("NotificationManager", () => {
  const connection = new HomeAssistantConnection("token234");
  const translator = getTranslator("en");
  const logger = new Logger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should send job notification to person", async () => {
    const person = {
      id: "person.test",
      internalId: "AZERTY",
      isHome: true,
      name: "Test",
    };
    const task = {
      id: "test_task",
      label: "This is a label",
      description: "This is a description",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    };
    (isTaskActive as any).mockReturnValue(true);

    const result = await syncPersonTask(
      connection,
      person,
      task,
      logger,
      translator
    );

    expect(isTaskActive).toHaveBeenCalledTimes(1);
    expect(isTaskActive).toHaveBeenCalledWith(task);

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

    expect(result).toStrictEqual({
      result: true,
    });
  });

  it("Should pass down empty message when task has no description", async () => {
    const person = {
      id: "person.test",
      internalId: "AZERTY",
      isHome: true,
      name: "Test",
    };
    const task = {
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    };
    (isTaskActive as any).mockReturnValue(true);

    await syncPersonTask(connection, person, task, logger, translator);

    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledTimes(
      1
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledWith(
      ""
    );
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });
  });

  it("Should pass notification url when url provided", async () => {
    const person = {
      id: "person.test",
      internalId: "AZERTY",
      isHome: true,
      name: "Test",
    };
    const task = {
      id: "test_task",
      label: "This is a label",
      description: "This is a description",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    };
    (isTaskActive as any).mockReturnValue(true);

    await syncPersonTask(
      connection,
      person,
      task,
      logger,
      translator,
      "/notificationUrl/path"
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

  it("Should send clear notification when task is not active", async () => {
    const person = {
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    };
    const task = {
      id: "test_task",
      label: "This is a label",
      description: "This is a description",
      startDate: dayjs(),
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    };
    (isTaskActive as any).mockReturnValue(false);

    const promise = await syncPersonTask(
      connection,
      person,
      task,
      logger,
      translator,
      "/notificationUrl/path"
    );

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
});

describe("createQuickActionNotificationAction", () => {
  const connection = new HomeAssistantConnection("token234");
  const translator = getTranslator("en");
  const logger = new Logger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const person: Person = {
    id: "person.test",
    internalId: "AZERTY",
    isHome: true,
    name: "Test",
  };
  const tasks: Task[] = [
    {
      id: "test_task",
      label: "This is a label",
      description: "This is a description",
      startDate: dayjs(),
      quickAction: true,
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    },
    {
      id: "test_task2",
      label: "This is a label2",
      description: "This is a description",
      startDate: dayjs(),
      quickAction: false,
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    },
    {
      id: "test_task3",
      label: "This is a label3",
      description: "This is a description",
      startDate: dayjs(),
      quickAction: true,
      jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
      active: true,
    },
  ];

  it("Should send notification when quick action is true", async () => {
    const result = await createQuickActionNotificationAction(
      connection,
      person,
      tasks,
      logger,
      translator
    );

    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledWith(
      "test"
    );
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledWith(
      "quick"
    );
    expect(MobileNotificationBuilder.prototype.title).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.title).toHaveBeenCalledWith(
      "Quick actions"
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledTimes(
      1
    );
    expect(MobileNotificationBuilder.prototype.message).toHaveBeenCalledWith(
      ""
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
    ).toHaveBeenCalledWith(ChannelMode.Action);
    expect(MobileNotificationBuilder.prototype.url).toHaveBeenCalledTimes(0);
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenCalledTimes(2);
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenNthCalledWith(
      1,
      {
        action: "trigger.test_task",
        title: "This is a label",
      }
    );
    expect(MobileNotificationBuilder.prototype.action).toHaveBeenNthCalledWith(
      2,
      {
        action: "trigger.test_task3",
        title: "This is a label3",
      }
    );

    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledWith();
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });

    expect(result).toStrictEqual({
      result: true,
    });
  });

  it("Should clear notification when no quick action", async () => {
    const result = await createQuickActionNotificationAction(
      connection,
      person,
      [],
      logger,
      translator
    );

    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledWith(
      "test"
    );
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledWith(
      "quick"
    );
    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledWith();
    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledWith();
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });

    expect(result).toStrictEqual({
      result: true,
    });
  });
});

describe("cleanUnknownTask", () => {
  const connection = new HomeAssistantConnection("token234");
  const logger = new Logger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should send notification when quick action is true", async () => {
    const result = await cleanUnknownTask(
      connection,
      "testID",
      "personId",
      logger
    );

    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.target).toHaveBeenCalledWith(
      "personId"
    );
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.tag).toHaveBeenCalledWith(
      "testID"
    );
    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.clear).toHaveBeenCalledWith();

    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledTimes(1);
    expect(MobileNotificationBuilder.prototype.build).toHaveBeenCalledWith();
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(1);
    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledWith({
      notification: "built",
    });

    expect(result).toStrictEqual({
      result: true,
    });
  });
});
