import mongoose from "mongoose";


const dbUrl: string | undefined = process.env.MONGO_URI;

if (!dbUrl) {
  console.error('MONGO_URI is undefined please provide database URL');
  process.exit(1);
}

const connectDB = async () => {
  try {
    // Fail fast instead of buffering queries when DB is unreachable.
    mongoose.set("bufferCommands", false);

    const connect = await mongoose.connect(dbUrl, {
      dbName: "Hive_DB",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log(`Server connected to host ${connect.connection.host}`);

  } catch (error) {
    console.error(`Failed to connect to database`, error);
    process.exit(1);
  }
}

export default connectDB;