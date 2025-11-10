// Quick script to initialize business types via API
const fetch = require('node-fetch');

async function initBusinessTypes() {
  try {
    console.log('🚀 Initializing business types...');
    
    const response = await fetch('http://localhost:3000/api/init-business-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result.message);
      console.log('📊 Count:', result.count);
    } else {
      console.log('❌ Failed:', response.status, response.statusText);
    }
    
    // Also check if business types are now available
    console.log('\n🔍 Checking business types...');
    const checkResponse = await fetch('http://localhost:3000/api/business-types');
    
    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      const data = checkResult.data || checkResult || [];
      console.log(`📋 Found ${data.length} business types:`);
      data.forEach(type => {
        console.log(`- ${type.name} (ID: ${type._id || type.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
  }
}

initBusinessTypes();