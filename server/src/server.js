"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // enable environment variables to read form .env file
const app_1 = require("./framework/config/app");
const db_1 = __importDefault(require("./framework/config/db"));
const PORT = process.env.PORT || 3000;
const bootstrap = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)();
    app_1.httpServer.listen(PORT, () => console.log(`Server is alive at PORT ${PORT}`));
});
bootstrap().catch((error) => {
    console.error("Server bootstrap failed:", error);
    process.exit(1);
});
