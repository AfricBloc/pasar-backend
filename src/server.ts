//THIS IS THE MAIN SERVER

import testRedisConnection from "@/db/redis";
import app from "./app";
import { PORT, ENV } from "./config/env.config";
import { verifyDBConnection } from "./db";

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${ENV}`);

  await verifyDBConnection();
  await testRedisConnection();
});
