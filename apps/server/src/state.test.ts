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
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should init new empty state", async () => {
    // Arrange
    exists.mockReturnValue(false);

    // Act
    const state = await State.get();

    // Assert
    expect(state).toStrictEqual({
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
      tasks: [
        {
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
      tasks: [
        {
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
      tasks: [
        {
          cron: "",
          id: "fd",
          label: "",
        },
      ],
    });
  });
});
