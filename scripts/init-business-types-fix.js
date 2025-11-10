const { MongoClient } = require('mongodb');

const defaultBusinessTypes = [
  {
    name: "Fashion Retail Store",
    description: "Complete clothing and fashion retail business",
    fields: [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "SKU", type: "text", required: true, enabled: true },
      { name: "Barcode", type: "barcode", required: false, enabled: true },
      { name: "Category", type: "select", required: true, enabled: true, options: ["Shirts", "Pants", "Dresses", "Jackets", "Accessories"] },
      { name: "Brand", type: "select", required: false, enabled: true, options: ["Nike", "Adidas", "Zara", "H&M", "Local Brand"] },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Min Stock", type: "number", required: false, enabled: true },
      { name: "Sizes", type: "text", required: false, enabled: true },
      { name: "Colors", type: "text", required: false, enabled: true },
      { name: "Material", type: "select", required: false, enabled: true, options: ["Cotton", "Polyester", "Silk", "Wool", "Denim", "Leather"] },
      { name: "Season", type: "select", required: false, enabled: true, options: ["Spring", "Summer", "Fall", "Winter", "All Season"] },
      { name: "Gender", type: "select", required: false, enabled: true, options: ["Men", "Women", "Kids", "Unisex"] },
      { name: "Description", type: "textarea", required: false, enabled: true }
    ]
  },
  {
    name: "Shoe Store",
    description: "Specialized footwear retail business",
    fields: [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "SKU", type: "text", required: true, enabled: true },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Shoe Type", type: "select", required: true, enabled: true, options: ["Sneakers", "Formal", "Boots", "Sandals", "Sports", "Casual"] },
      { name: "Shoe Size", type: "select", required: true, enabled: true, options: ["6", "7", "8", "9", "10", "11", "12"] },
      { name: "Width", type: "select", required: false, enabled: true, options: ["Narrow", "Medium", "Wide", "Extra Wide"] }
    ]
  }
];

async function initBusinessTypes() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/erp');
  
  try {
    await client.connect();
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Check if business types already exist
    const existingCount = await businessTypesCollection.countDocuments();
    
    if (existingCount === 0) {
      // Insert default business types
      const businessTypesToInsert = defaultBusinessTypes.map(type => ({
        ...type,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const result = await businessTypesCollection.insertMany(businessTypesToInsert);
      console.log(`✅ Initialized ${result.insertedCount} business types successfully!`);
      
      // List the inserted business types with their IDs
      const insertedTypes = await businessTypesCollection.find({}).toArray();
      console.log('\n📋 Available Business Types:');
      insertedTypes.forEach(type => {
        console.log(`- ${type.name} (ID: ${type._id})`);
      });
      
    } else {
      console.log(`ℹ️  Business types already exist (${existingCount} found)`);
      
      // List existing business types
      const existingTypes = await businessTypesCollection.find({}).toArray();
      console.log('\n📋 Existing Business Types:');
      existingTypes.forEach(type => {
        console.log(`- ${type.name} (ID: ${type._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize business types:', error);
  } finally {
    await client.close();
  }
}

initBusinessTypes();