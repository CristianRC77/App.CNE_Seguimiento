import { MongoClient, ObjectId } from 'mongodb';

const mongoUri = 'mongodb://Vercel-Admin-elecciones_exterior_db:Roliss.88@ac-ffogiwh-shard-00-00.bs5pvnx.mongodb.net:27017,ac-ffogiwh-shard-00-01.bs5pvnx.mongodb.net:27017,ac-ffogiwh-shard-00-02.bs5pvnx.mongodb.net:27017/?authSource=admin&replicaSet=atlas-2xf2al-shard-0&retryWrites=true&w=majority&tls=true';
const databaseName = 'db_exterior_cne';

async function testSearch() {
  const client = new MongoClient(mongoUri);
  try {
    console.log('🔗 Conectando a MongoDB...\n');
    await client.connect();
    const db = client.db(databaseName);
    const users = db.collection('users');
    
    const payloadSub = '65f1a2b3c4d5e6f7a8b9c0f1';
    
    console.log(`🔍 Simulando búsqueda de usuario con payload.sub = "${payloadSub}"`);
    console.log(`   Tipo: ${typeof payloadSub}`);
    console.log(`   Length: ${String(payloadSub).length}\n`);
    
    // Búsqueda 1: con string
    console.log('📌 Búsqueda 1: { _id: payload.sub, activo: true }');
    const user1 = await users.findOne({ _id: payloadSub, activo: true });
    console.log(`   Resultado: ${user1 ? '✅ ENCONTRADO' : '❌ No encontrado'}`);
    if (user1) {
      console.log(`   Username: ${user1.username}`);
    }
    
    // Búsqueda 2: sin filtro activo
    console.log('\n📌 Búsqueda 2: { _id: payload.sub } (sin activo:true)');
    const user2 = await users.findOne({ _id: payloadSub });
    console.log(`   Resultado: ${user2 ? '✅ ENCONTRADO' : '❌ No encontrado'}`);
    if (user2) {
      console.log(`   Username: ${user2.username}`);
      console.log(`   Activo: ${user2.activo}`);
    }
    
    // Búsqueda 3: con ObjectId
    console.log('\n📌 Búsqueda 3: { _id: new ObjectId(payload.sub), activo: true }');
    const user3 = await users.findOne({ _id: new ObjectId(payloadSub), activo: true });
    console.log(`   Resultado: ${user3 ? '✅ ENCONTRADO' : '❌ No encontrado'}`);
    if (user3) {
      console.log(`   Username: ${user3.username}`);
    }
    
    // Búsqueda 4: listar TODOS los usuarios para ver cómo son los IDs
    console.log('\n📌 Búsqueda 4: Listando todos los usuarios para ver tipos de _id');
    const all = await users.find({}).toArray();
    all.forEach((u) => {
      const idType = u._id instanceof ObjectId ? 'ObjectId' : 'string';
      console.log(`   _id: ${u._id} (tipo: ${idType})`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

testSearch();
