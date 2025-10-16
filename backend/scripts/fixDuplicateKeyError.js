// Fix duplicate key error on systemId index
// Run with: node scripts/fixDuplicateKeyError.js

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    console.log('🔧 Fixing NetworkMonitoring Index...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('networkmonitorings');
    
    // Check existing indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });
    console.log('');
    
    // Check if problematic index exists
    const systemIdIndex = indexes.find(idx => idx.key.systemId === 1 && idx.unique);
    
    if (systemIdIndex) {
      console.log('❌ Found WRONG unique index on systemId!');
      console.log(`   Index name: ${systemIdIndex.name}\n`);
      
      console.log('🗑️ Dropping incorrect index...');
      await collection.dropIndex(systemIdIndex.name);
      console.log('✅ Index dropped successfully!\n');
    } else {
      console.log('✅ No problematic index found (might already be fixed)\n');
    }
    
    // Verify indexes after fix
    console.log('📋 Indexes after fix:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });
    console.log('');
    
    console.log('✅ Database index fixed!');
    console.log('   Multiple logs per system are now allowed.');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixIndex();

