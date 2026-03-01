import { MongoClient } from "mongodb";

const DB_NAME = "niti-setu";

let client;
let db;

const normalizeMongoUri = (rawUri) => {
  let uri = String(rawUri || "").trim();

  if (
    (uri.startsWith("\"") && uri.endsWith("\"")) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1);
  }

  // Encode username/password safely when special characters are used.
  const authMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^@/]+)@(.+)$/i);
  if (authMatch) {
    const [, prefix, userInfo, rest] = authMatch;
    const separatorIndex = userInfo.indexOf(":");
    if (separatorIndex > -1) {
      const username = userInfo.slice(0, separatorIndex);
      const password = userInfo.slice(separatorIndex + 1);
      uri = `${prefix}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${rest}`;
    }
  }

  return uri;
};

const buildMongoHint = (error, uri) => {
  if (String(error?.message || "").includes("Cannot destructure property 'subject'")) {
    return (
      "Atlas SRV URI parsing failed. Check MONGO_URI credentials for special characters and ensure they are URL-encoded. " +
      "If this persists, use a non-SRV URI (mongodb://host1,host2/?replicaSet=...&tls=true) from Atlas."
    );
  }

  if (uri.startsWith("mongodb+srv://")) {
    return "Could not resolve/connect to MongoDB Atlas SRV host. Verify DNS/network access and Atlas IP allowlist.";
  }

  return "Could not connect to MongoDB. Verify MONGO_URI and network access.";
};

export const connectDB = async () => {
  if (db) return db;

  const rawUri = Bun.env.MONGO_URI;
  if (!rawUri) {
    throw new Error("MONGO_URI is required");
  }
  const uri = normalizeMongoUri(rawUri);

  client = new MongoClient(uri, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 12000,
    retryWrites: true,
    tls: true
  });

  try {
    await client.connect();
  } catch (error) {
    const hint = buildMongoHint(error, uri);
    throw new Error(`MongoDB connection failed: ${error.message}. ${hint}`);
  }

  db = client.db(DB_NAME);

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("analytics").createIndex({ eventType: 1 }),
    db.collection("schemes").createIndex({ name: 1 })
  ]);

  console.log(`MongoDB connected: ${db.databaseName}`);
  return db;
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not connected.");
  }
  return db;
};

export const getCollection = (name) => getDB().collection(name);

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
};
