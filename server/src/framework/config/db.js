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
const mongoose_1 = __importDefault(require("mongoose"));
const dbUrl = process.env.MONGO_URI;
if (!dbUrl) {
    console.error('MONGO_URI is undefined please provide database URL');
    process.exit(1);
}
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fail fast instead of buffering queries when DB is unreachable.
        mongoose_1.default.set("bufferCommands", false);
        const connect = yield mongoose_1.default.connect(dbUrl, {
            dbName: "Hive_DB",
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        console.log(`Server connected to host ${connect.connection.host}`);
    }
    catch (error) {
        console.error(`Failed to connect to database`, error);
        process.exit(1);
    }
});
exports.default = connectDB;
