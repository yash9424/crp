# Database Structure for Dynamic Inventory System

## Collections Overview

### 1. `tenant_fields` Collection
**Purpose**: Stores field configuration for each tenant
```json
{
  "_id": "ObjectId",
  "tenantId": "tenant_123",
  "businessType": "clothing_store",
  "fields": [
    {
      "name": "Name",
      "type": "text",
      "required": true,
      "enabled": true
    },
    {
      "name": "Price",
      "type": "number", 
      "required": true,
      "enabled": true
    },
    {
      "name": "Category",
      "type": "select",
      "required": true,
      "enabled": true,
      "options": ["Shirts", "Pants", "Dresses"]
    }
  ],
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. `products_{tenantId}` Collection
**Purpose**: Stores actual inventory items with dynamic fields
```json
{
  "_id": "ObjectId",
  "name": "Blue Cotton Shirt",
  "sku": "SKU-1234567890",
  "barcode": "FS781378977",
  "category": "Shirts",
  "price": 29.99,
  "cost_price": 15.00,
  "stock": 50,
  "min_stock": 10,
  "sizes": "S,M,L,XL",
  "colors": "Blue,White",
  "brand": "Fashion Brand",
  "material": "Cotton",
  "description": "Comfortable cotton shirt",
  "tenantId": "tenant_123",
  "storeId": "tenant_123",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Data Flow Process

### Step 1: Field Configuration
```
User configures fields → POST /api/tenant-fields → Saves to tenant_fields collection
```

### Step 2: Product Creation
```
User fills form → POST /api/inventory → Reads tenant_fields → Saves to products_{tenantId}
```

### Step 3: Data Display
```
Load inventory → GET /api/inventory → Reads products_{tenantId} → Shows in table
```

## Field Name Mapping

Dynamic fields are stored using lowercase with underscores:
- "Product Name" → `product_name`
- "Cost Price" → `cost_price` 
- "Brand Name" → `brand_name`

## Example Database Queries

### Save Field Configuration
```javascript
db.tenant_fields.updateOne(
  { tenantId: "tenant_123" },
  { 
    $set: {
      tenantId: "tenant_123",
      businessType: "clothing_store", 
      fields: [...],
      updatedAt: new Date()
    }
  },
  { upsert: true }
)
```

### Save Product with Dynamic Fields
```javascript
db.products_tenant_123.insertOne({
  name: "Blue Shirt",
  price: 29.99,
  // Dynamic fields added based on configuration
  brand: "Nike",
  material: "Cotton",
  custom_field_1: "Custom Value",
  tenantId: "tenant_123",
  createdAt: new Date()
})
```

### Retrieve Products
```javascript
db.products_tenant_123.find({}).sort({ createdAt: -1 })
```