import {copy} from "fs-extra";

const buildAddon = async () => {
  console.log("Copying backend");
  await copy("./apps/back/dist", "./dist/", { overwrite: true });

  console.log("Copying frontend");
  await copy("./apps/front/dist", "./dist/public/", { overwrite: true });

  console.log("Copying .env");
  await copy("./apps/back/.env", "./dist/.env");

  console.log("Copying Dockerfile");
  await copy("./apps/back/Dockerfile", "./dist/Dockerfile");
}

buildAddon();