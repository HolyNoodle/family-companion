import { existsSync } from "fs";
import * as fs from "fs/promises";
import { AppState } from "../types";

const path = require("path");

async function isExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(filePath: string, data: string) {
  try {
    const dirname = path.dirname(filePath);
    const exist = await isExists(dirname);
    if (!exist) {
      await fs.mkdir(dirname, { recursive: true });
    }

    await fs.writeFile(filePath, data, "utf8");
  } catch (err: any) {
    throw new Error(err);
  }
}

export class State {
  private static state: AppState;
  private static path: string;

  public static setPath(path: string) {
    State.path = path;
  }

  public static async get() {
    if (State.state) {
      return State.state;
    }

    if (existsSync(State.path)) {
      State.state = JSON.parse(
        (await fs.readFile(State.path)).toString("utf-8")
      );
    } else {
      State.state = {
        tasks: [],
      };
    }

    return State.state;
  }

  public static set(state: AppState) {
    State.state = state;

    writeFile(State.path, JSON.stringify(state));
  }
}
