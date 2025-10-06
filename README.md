# Fashion Store ERP Management System

A comprehensive Enterprise Resource Planning (ERP) system built with Next.js for fashion retail stores, featuring multi-tenant architecture, inventory management, POS system, and more.

## 🚀 Features

### Core Modules
- **Multi-Tenant Architecture** - Support for multiple stores with isolated data
- **Inventory Management** - Complete product catalog with sizes, colors, materials
- **Point of Sale (POS)** - Fast billing system with barcode scanning
- **Customer Management** - Customer database with purchase history
- **Employee Management** - Staff records and role management
- **Purchase Management** - Supplier orders and stock management
- **Reports & Analytics** - Sales reports and business insights
- **WhatsApp Integration** - Send bills via WhatsApp
- **Plan Management** - Subscription-based feature access

### Advanced Features
- **Dynamic Tax Calculation** - Configurable tax rates from settings
- **Text Minus Mode** - Special pricing mode for discounts
- **Bill PDF Generation** - Professional invoice printing
- **CSV Import/Export** - Bulk data operations
- **Feature Guards** - Plan-based feature restrictions
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   DATABASE_URL="your-mongodb-connection-string"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── super-admin/       # Super admin dashboard
│   └── tenant/            # Tenant-specific pages
├── components/            # Reusable UI components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── prisma/               # Database schema
└── public/               # Static assets
```

## 🔐 User Roles

### Super Admin
- Manage all tenants and plans
- View system-wide analytics
- Configure feature matrix
- Handle plan requests

### Tenant Admin (Store Owner)
- Manage store inventory
- Process sales transactions
- View store reports
- Manage employees and customers
- Configure store settings

## 📊 Key Features Detail

### Inventory Management
- Add/edit/delete products
- Bulk CSV import/export
- Size and color variants
- Stock level tracking
- Low stock alerts
- Category management

### POS System
- Fast product search
- Barcode scanning
- Multiple payment methods
- Customer selection
- Discount application
- Bill printing and WhatsApp sharing

### Dynamic Pricing
- Configurable tax rates
- Text minus mode for special pricing
- Real-time price calculations
- Final price display

### Multi-Tenant Support
- Isolated data per tenant
- Plan-based feature access
- Tenant-specific settings
- Scalable architecture

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
DATABASE_URL="production-mongodb-url"
NEXTAUTH_SECRET="secure-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

## 📱 Mobile Support

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Touch devices for POS operations

## 🔧 Configuration

### Store Settings
- Store name and address
- Contact information
- Tax rates and GST details
- Bill numbering
- Terms and conditions
- WhatsApp integration

### Plan Management
- Feature-based access control
- Product limits
- User limits
- Upgrade notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@fashionerp.com
- Phone: +91 9427300816

## 🔄 Version History

- **v1.0.0** - Initial release with core ERP features
- **v1.1.0** - Added dynamic tax calculation and text minus mode
- **v1.2.0** - Enhanced bill printing and notification system

---

**Built with ❤️ for Fashion Retail Stores**