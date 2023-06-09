import { State } from "./state";

import * as fs from "fs";
import * as fsp from "fs/promises";
import { AppState } from "./types";
import dayjs from "dayjs";

jest.mock("fs");
jest.mock("fs/promises");

describe("AppState", () => {
  let exists = fs.existsSync as any as jest.SpyInstance;
  let readFile = fsp.readFile as any as jest.SpyInstance;
  let writeFile = fsp.writeFile as any as jest.SpyInstance;
  let access = fsp.access as any as jest.SpyInstance;
  let mkdir = fsp.mkdir as any as jest.SpyInstance;

  beforeEach(() => {
    State.setPath("test/path");
    State.set(undefined as any);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2023, 0, 1, 2, 4, 2, 345)));
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  it("Should init new empty state", async () => {
    // Arrange
    exists.mockReturnValue(false);

    // Act
    const state = await State.get();

    // Assert
    expect(state).toStrictEqual({
      persons: [],
      tasks: [],
    });
    expect(exists).toHaveBeenCalledTimes(1);
    expect(exists).toHaveBeenCalledWith("test/path");
  });

  it("Should return file state", async () => {
    // Arrange
    const fileState: AppState = {
      tasks: [
        {
          cron: "",
          id: "fd",
          label: "",
          startDate: dayjs(),
          active: true,
          jobs: [],
        },
      ],
      persons: [],
    };
    exists.mockReturnValue(true);
    readFile.mockResolvedValue(JSON.stringify(fileState));

    // Act
    const state = await State.get();

    // Assert
    expect(exists).toHaveBeenCalledTimes(1);
    expect(exists).toHaveBeenCalledWith("test/path");
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith("test/path");

    expect(state).toStrictEqual({
      persons: [],
      tasks: [
        {
          active: true,
          jobs: [],
          startDate: "2023-01-01T02:04:02.345Z",
          cron: "",
          id: "fd",
          label: "",
        },
      ],
    });
  });

  it("Should write file when setting state with create folder", async () => {
    // Arrange
    const state: AppState = {
      tasks: [
        {
          cron: "",
          id: "fd",
          label: "",
          startDate: dayjs(),
          active: true,
          jobs: [],
        },
      ],
      persons: [],
    };
    access.mockRejectedValue("not exists");

    // Act
    await State.set(state);

    // Assert
    expect(exists).toHaveBeenCalledTimes(0);
    expect(writeFile).toHaveBeenCalledTimes(2); // 2 because of reset in before each
    expect(writeFile).toHaveBeenCalledWith(
      "test/path",
      JSON.stringify(state),
      "utf8"
    );
    expect(access).toHaveBeenCalledTimes(1);
    expect(access).toHaveBeenCalledWith("test");
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(mkdir).toHaveBeenCalledWith("test", { recursive: true });
    expect(await State.get()).toStrictEqual({
      persons: [],
      tasks: [
        {
          active: true,
          jobs: [],
          startDate: dayjs("2023-01-01T02:04:02.345Z"),
          cron: "",
          id: "fd",
          label: "",
        },
      ],
    });
  });

  it("Should write file when setting state without create folder", async () => {
    // Arrange
    const state: AppState = {
      tasks: [
        {
          cron: "",
          id: "fd",
          label: "",
          startDate: dayjs(),
          active: true,
          jobs: [],
        },
      ],
      persons: [],
    };
    access.mockResolvedValue(true);

    // Act
    await State.set(state);

    // Assert
    expect(exists).toHaveBeenCalledTimes(0);
    expect(writeFile).toHaveBeenCalledTimes(2); // 2 because of reset in before each
    expect(writeFile).toHaveBeenCalledWith(
      "test/path",
      JSON.stringify(state),
      "utf8"
    );
    expect(access).toHaveBeenCalledTimes(1);
    expect(access).toHaveBeenCalledWith("test");
    expect(mkdir).toHaveBeenCalledTimes(0);
    expect(await State.get()).toStrictEqual({
      persons: [],
      tasks: [
        {
          active: true,
          jobs: [],
          startDate: dayjs("2023-01-01T02:04:02.345Z"),
          cron: "",
          id: "fd",
          label: "",
        },
      ],
    });
  });
});
