import { ChannelMode, MobileNotificationBuilder } from "./notification";

describe("MobileNotificationBuilder", () => {
  it("Should instanciate builder", () => {
    const builder = new MobileNotificationBuilder();

    expect(builder).toBeInstanceOf(MobileNotificationBuilder);
  });

  it("Should set the target", () => {
    const builder = new MobileNotificationBuilder();

    builder.target("testId");

    expect(builder.build()).toMatchObject({
      domain: "notify",
      type: "call_service",
      service: "mobile_app_testId",
    });
  });

  it("Should set the channel mode to critical", () => {
    const builder = new MobileNotificationBuilder();

    builder.channelMode(ChannelMode.Critical);

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          channel: "FC_Critical",
          mode: "max",
        },
      },
    });
  });

  it("Should set the channel mode to action", () => {
    const builder = new MobileNotificationBuilder();

    builder.channelMode(ChannelMode.Action);

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          channel: "FC_Action",
          mode: "min",
        },
      },
    });
  });

  it("Should default to General channel mode", () => {
    const builder = new MobileNotificationBuilder();

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          channel: "General",
          mode: "high",
        },
      },
    });
  });

  it("Should set notification message", () => {
    const builder = new MobileNotificationBuilder();

    builder.message("this is a message");

    expect(builder.build()).toMatchObject({
      service_data: {
        message: "this is a message",
      },
    });
  });

  it("Should set title", () => {
    const builder = new MobileNotificationBuilder();

    builder.title("this is a title");

    expect(builder.build()).toMatchObject({
      service_data: {
        title: "this is a title",
      },
    });
  });

  it("Should set persistent", () => {
    const builder = new MobileNotificationBuilder();

    builder.persist(true);

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          persistent: true,
        },
      },
    });
  });
  it("Should set sticky", () => {
    const builder = new MobileNotificationBuilder();

    builder.stick(true);

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          sticky: true,
        },
      },
    });
  });
  it("Should set url", () => {
    const builder = new MobileNotificationBuilder();

    builder.url("I am a url");

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          url: "I am a url",
          clickAction: "I am a url",
        },
      },
    });
  });

  it("Should set url", () => {
    const builder = new MobileNotificationBuilder();

    builder.tag("I am a tag");

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          tag: "I am a tag",
        },
      },
    });
  });

  it("Should set actions", () => {
    const builder = new MobileNotificationBuilder();

    builder.action({
      action: "action1",
      title: "Youhouh title",
    });

    expect(builder.build()).toMatchObject({
      service_data: {
        data: {
          actions: [
            {
              action: "action1",
              title: "Youhouh title",
            },
          ],
        },
      },
    });
  });

  it("Should replace message by clear action", () => {
    const builder = new MobileNotificationBuilder();

    builder.message("I am a message");

    builder.clear();

    expect(builder.build()).toMatchObject({
      service_data: {
        message: "clear_notification",
      },
    });
  });
});
