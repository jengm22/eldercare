// src/mongo.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

let client;
let isConnected = false;

export async function connectMongo() {
  if (client) return client;
  client = new MongoClient(uri, {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL || "100", 10),
    minPoolSize: 0,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    retryWrites: true
  });
  await client.connect();
  // Ensure we can actually talk to the DB
  await client.db(process.env.MONGODB_DB || "eldercare").command({ ping: 1 });
  isConnected = true;
  return client;
}

export function mongoReady() {
  return isConnected;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    isConnected = false;
  }
}
