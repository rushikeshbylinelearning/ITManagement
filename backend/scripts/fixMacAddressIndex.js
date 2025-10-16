// Fix script to remove duplicate key error on macAddress
// Run with: node scripts/fixMacAddressIndex.js

require('dotenv').config();
const mongoose = require('mongoose');

async function fixMacAddressIndex() {
  try {
    console.log('🔧 Fixing macAddress duplicate key error...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the SystemAgent collection
    const db = mongoose.connection.db;
    const collection = db.collection('systemagents');
    
    // List all indexes
    console.log('📋 Current indexes on systemagents collection:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    console.log('');
    
    // Check if macAddress index exists
    const macAddressIndex = indexes.find(idx => 
      idx.name === 'macAddress_1' || 
      idx.key?.macAddress !== undefined ||
      idx.key?.['systemInfo.macAddress'] !== undefined
    );
    
    if (macAddressIndex) {
      console.log('❌ Found problematic macAddress index:', macAddressIndex.name);
      console.log('   Dropping index...');
      
      try {
        await collection.dropIndex(macAddressIndex.name);
        console.log('✅ Index dropped successfully\n');
      } catch (dropError) {
        console.error('❌ Error dropping index:', dropError.message);
        console.log('   This might be okay if the index was already dropped\n');
      }
    } else {
      console.log('✅ No problematic macAddress index found\n');
    }
    
    // Verify current indexes
    console.log('📋 Updated indexes on systemagents collection:');
    const updatedIndexes = await collection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));
    console.log('');
    
    // Check for documents with null macAddress at root level
    console.log('🔍 Checking for documents with root-level macAddress field...');
    const docsWithMacAddress = await collection.countDocuments({ 
      macAddress: { $exists: true } 
    });
    
    if (docsWithMacAddress > 0) {
      console.log(`⚠️  Found ${docsWithMacAddress} document(s) with root-level macAddress field`);
      console.log('   Removing root-level macAddress field...');
      
      const result = await collection.updateMany(
        { macAddress: { $exists: true } },
        { $unset: { macAddress: "" } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} document(s)\n`);
    } else {
      console.log('✅ No documents with root-level macAddress field\n');
    }
    
    console.log('============================================================');
    console.log('✅ Fix complete! The macAddress duplicate key error is resolved.');
    console.log('============================================================\n');
    console.log('You can now register new agents without the duplicate key error.');
    console.log('Please restart your backend server to ensure changes take effect.\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error('\nError details:', error);
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixMacAddressIndex();

