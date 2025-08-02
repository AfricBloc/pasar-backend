//THIS IS THE MAIN SERVER

import app from "./app";
import { PORT, NODE_ENV } from "./src/config/env";
import { verifyDBConnection } from "./src/db";

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  await verifyDBConnection();
});
