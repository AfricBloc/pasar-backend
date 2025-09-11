"use strict";
//THIS IS THE MAIN SERVER
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("@/db/redis"));
const app_1 = __importDefault(require("./app"));
const env_config_1 = require("./src/config/env.config");
const db_1 = require("./src/db");
app_1.default.listen(env_config_1.PORT, async () => {
    console.log(`Server is running on port ${env_config_1.PORT}`);
    console.log(`Environment: ${env_config_1.ENV}`);
    await (0, db_1.verifyDBConnection)();
    await (0, redis_1.default)();
});
