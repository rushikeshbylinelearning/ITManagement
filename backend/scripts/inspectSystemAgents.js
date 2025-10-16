// Script to inspect SystemAgent collection and indexes
// Run with: node scripts/inspectSystemAgents.js

require('dotenv').config();
const mongoose = require('mongoose');

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting SystemAgent Database...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('systemagents');
    
    // 1. Check all indexes
    console.log('=' .repeat(60));
    console.log('📋 INDEXES on systemagents collection:');
    console.log('=' .repeat(60));
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`\n${i + 1}. Index Name: ${index.name}`);
      console.log(`   Keys: ${JSON.stringify(index.key)}`);
      console.log(`   Unique: ${index.unique || false}`);
      console.log(`   Sparse: ${index.sparse || false}`);
    });
    console.log('\n' + '=' .repeat(60));
    
    // 2. Count documents
    console.log('\n📊 DOCUMENT COUNT:');
    const totalCount = await collection.countDocuments();
    console.log(`   Total documents: ${totalCount}`);
    
    // 3. Check for macAddress field at root level
    const withRootMac = await collection.countDocuments({ 
      macAddress: { $exists: true } 
    });
    console.log(`   With root-level macAddress: ${withRootMac}`);
    
    const withNullRootMac = await collection.countDocuments({ 
      macAddress: null 
    });
    console.log(`   With macAddress = null: ${withNullRootMac}`);
    
    const withSystemInfoMac = await collection.countDocuments({ 
      'systemInfo.macAddress': { $exists: true } 
    });
    console.log(`   With systemInfo.macAddress: ${withSystemInfoMac}`);
    
    // 4. Show all documents (limited fields)
    if (totalCount > 0 && totalCount <= 10) {
      console.log('\n' + '=' .repeat(60));
      console.log('📄 ALL DOCUMENTS (summary):');
      console.log('=' .repeat(60));
      
      const docs = await collection.find({}).toArray();
      docs.forEach((doc, i) => {
        console.log(`\n${i + 1}. Document ID: ${doc._id}`);
        console.log(`   systemId: ${doc.systemId}`);
        console.log(`   systemName: ${doc.systemName}`);
        console.log(`   macAddress (root): ${doc.macAddress !== undefined ? doc.macAddress : '(not present)'}`);
        console.log(`   systemInfo.macAddress: ${doc.systemInfo?.macAddress !== undefined ? doc.systemInfo.macAddress : '(not present)'}`);
        console.log(`   isActive: ${doc.isActive}`);
        console.log(`   status: ${doc.status}`);
      });
      console.log('\n' + '=' .repeat(60));
    }
    
    // 5. Identify the problem
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 PROBLEM DIAGNOSIS:');
    console.log('=' .repeat(60));
    
    const macAddressIndex = indexes.find(idx => 
      idx.name === 'macAddress_1' || 
      (idx.key && idx.key.macAddress !== undefined)
    );
    
    if (macAddressIndex) {
      console.log('\n❌ PROBLEM FOUND:');
      console.log(`   Index "${macAddressIndex.name}" exists on macAddress field`);
      console.log(`   Unique: ${macAddressIndex.unique ? 'YES' : 'NO'}`);
      
      if (macAddressIndex.unique) {
        console.log('\n⚠️  This unique index is causing the duplicate key error!');
        console.log('   MongoDB does NOT allow multiple documents with macAddress=null');
        console.log('   when a unique index exists on that field.\n');
        
        if (withNullRootMac > 1) {
          console.log(`   Currently ${withNullRootMac} documents have macAddress=null`);
          console.log('   This is why you cannot create new agents.\n');
        }
      }
      
      console.log('=' .repeat(60));
      console.log('🔧 SOLUTION:');
      console.log('=' .repeat(60));
      console.log('\nRun this command to fix the issue:\n');
      console.log('   node scripts/fixMacAddressIndex.js\n');
      console.log('This will:');
      console.log('   1. Drop the macAddress_1 index');
      console.log('   2. Remove root-level macAddress fields from documents');
      console.log('   3. Allow you to create new agents without errors');
      console.log('\n' + '=' .repeat(60));
      
    } else {
      console.log('\n✅ No problematic macAddress index found!');
      console.log('   The duplicate key error should not occur.\n');
      console.log('If you\'re still getting the error:');
      console.log('   1. Restart your backend server');
      console.log('   2. Clear any cached schema/model definitions');
      console.log('   3. Try creating an agent again\n');
    }
    
    await mongoose.connection.close();
    console.log('✅ Inspection complete!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Inspection failed:', error.message);
    console.error('Error:', error);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

inspectDatabase();

