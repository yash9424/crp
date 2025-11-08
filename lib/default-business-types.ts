export const defaultBusinessTypes = [
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
      { name: "Shoe Type", type: "select", required: true, enabled: true, options: ["Sneakers", "Formal", "Boots", "Sandals", "Sports", "Casual"] },
      { name: "Shoe Size", type: "select", required: true, enabled: true, options: ["6", "7", "8", "9", "10", "11", "12"] },
      { name: "Width", type: "select", required: false, enabled: true, options: ["Narrow", "Medium", "Wide", "Extra Wide"] },
      { name: "Sole Type", type: "select", required: false, enabled: true, options: ["Rubber", "Leather", "Synthetic", "EVA"] },
      { name: "Heel Height", type: "number", required: false, enabled: true },
      { name: "Waterproof", type: "select", required: false, enabled: true, options: ["Yes", "No"] }
    ]
  },
  {
    name: "Accessories Store",
    description: "Fashion accessories and jewelry business",
    fields: [
      { name: "Accessory Type", type: "select", required: true, enabled: true, options: ["Jewelry", "Bags", "Belts", "Watches", "Sunglasses", "Scarves", "Hats"] },
      { name: "Metal Type", type: "select", required: false, enabled: true, options: ["Gold", "Silver", "Platinum", "Stainless Steel", "Brass"] },
      { name: "Stone Type", type: "select", required: false, enabled: true, options: ["Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "None"] },
      { name: "Chain Length", type: "number", required: false, enabled: true },
      { name: "Ring Size", type: "select", required: false, enabled: true, options: ["5", "6", "7", "8", "9", "10", "11", "12"] },
      { name: "Warranty Period", type: "number", required: false, enabled: true }
    ]
  },
  {
    name: "Electronics Store",
    description: "Consumer electronics and gadgets",
    fields: [
      { name: "Product Type", type: "select", required: true, enabled: true, options: ["Smartphone", "Laptop", "Tablet", "Headphones", "Charger", "Case"] },
      { name: "Model Number", type: "text", required: true, enabled: true },
      { name: "Warranty", type: "number", required: false, enabled: true },
      { name: "Battery Life", type: "text", required: false, enabled: true },
      { name: "Screen Size", type: "number", required: false, enabled: true },
      { name: "Storage", type: "select", required: false, enabled: true, options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
      { name: "Condition", type: "select", required: true, enabled: true, options: ["New", "Refurbished", "Used"] }
    ]
  },
  {
    name: "Grocery Store",
    description: "Food and grocery items",
    fields: [
      { name: "Product Type", type: "select", required: true, enabled: true, options: ["Fruits", "Vegetables", "Dairy", "Meat", "Beverages", "Snacks", "Frozen"] },
      { name: "Expiry Date", type: "date", required: true, enabled: true },
      { name: "Weight", type: "number", required: false, enabled: true },
      { name: "Unit", type: "select", required: false, enabled: true, options: ["kg", "grams", "liters", "pieces", "packets"] },
      { name: "Organic", type: "select", required: false, enabled: true, options: ["Yes", "No"] },
      { name: "Storage Type", type: "select", required: false, enabled: true, options: ["Room Temperature", "Refrigerated", "Frozen"] }
    ]
  }
]