
import { config } from "dotenv"
config(); // enable environment variables to read form .env file

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