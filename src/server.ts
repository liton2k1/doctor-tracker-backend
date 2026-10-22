import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config";
import { adminSeed } from "./app/utils/seedAdmin";
import { seedSampleData } from "./app/utils/seedSampleData";

let server: Server;

const main = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    await adminSeed();
    await seedSampleData();
    server = app.listen(envVars.PORT, () => {
      console.log(`Server is running on port ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
main();

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down...`);
  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.log("Unhandled rejection detected :", error);
  shutdown("unhandledRejection");
});
