//THIS IS THE MAIN SERVER

import app from "./app";
import { PORT, ENV } from "./src/config/env.config";
import { verifyDBConnection } from "./src/db";

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${ENV}`);

  await verifyDBConnection();
});
