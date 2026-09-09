
import { config } from "dotenv"
config(); // enable environment variables to read form .env file

// Fail fast on a missing signing key rather than booting, passing /health,
// then throwing on every auth call. (db.ts does the same for MONGO_URI.)
if (!process.env.JWT_SECRET_KEY) {
  console.error("JWT_SECRET_KEY is undefined — set it before starting the server");
  process.exit(1);
}

import { httpServer } from "./framework/config/app";
import connectDB from "./framework/config/db";

const PORT: number | string = process.env.PORT || 3000;

const bootstrap = async () => {
  await connectDB();
  httpServer.listen(PORT, () => console.log(`Server is alive at PORT ${PORT}`));
};

bootstrap().catch((error) => {
  console.error("Server bootstrap failed:", error);
  process.exit(1);
});