import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb://Vercel-Admin-elecciones_exterior_db:Roliss.88@ac-ffogiwh-shard-00-00.bs5pvnx.mongodb.net:27017,ac-ffogiwh-shard-00-01.bs5pvnx.mongodb.net:27017,ac-ffogiwh-shard-00-02.bs5pvnx.mongodb.net:27017/?authSource=admin&replicaSet=atlas-2xf2al-shard-0&retryWrites=true&w=majority&tls=true';
const databaseName = 'db_exterior_cne';

async function checkUsers() {
  const client = new MongoClient(mongoUri);
  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    const db = client.db(databaseName);
    
    const usersCollection = db.collection('users');
    const count = await usersCollection.countDocuments({});
    console.log(`\n📊 Total usuarios: ${count}`);
    
    const allUsers = await usersCollection.find({}).toArray();
    console.log('\n📋 Usuarios (documento completo):');
    allUsers.forEach((u) => {
      console.log(JSON.stringify(u, null, 2));
      console.log('---');
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

checkUsers();
