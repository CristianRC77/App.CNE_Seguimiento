import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'db_exterior_cne';

// Se reutiliza una única promesa de conexión entre solicitudes del proceso Node.
let clientPromise;

export const getDatabase = async () => {
  if (!mongoUri) throw new Error('Falta la variable MONGODB_URI en el entorno de ejecución.');
  if (!clientPromise) clientPromise = new MongoClient(mongoUri).connect();
  const client = await clientPromise;
  return client.db(databaseName);
};

export const getCollection = async (name) => (await getDatabase()).collection(name);
