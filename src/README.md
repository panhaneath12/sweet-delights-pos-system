# Sweet Delights Bakery - POS System

A modern, tablet-first Point of Sale (POS) system designed specifically for small bakeries and cake shops.

## Features

### User Management
- **PIN-based Authentication** - Quick 4-digit PIN login for fast access
- **Role-based Access Control** - ADMIN and CASHIER roles with different permissions
- **Multi-user Support** - Multiple cashiers can work across different sessions

### Cash Session Management
- **Session Opening** - Record opening cash amount with optional notes
- **Session Tracking** - Monitor cash drawer balance throughout the day
- **Historical Records** - View previous session summaries

### Product Management
- **Categories** - Organize products by type (Cakes, Cupcakes, Pastries, etc.)
- **Variants & Add-ons** - Support for Size, Flavor, and Topping variations with custom pricing
- **Quick Search** - Fast product search and filtering
- **Visual Product Grid** - Product cards with images for easy identification

### Order Management
- **Order Types** - Support for Dine-in, Takeaway, Delivery, and Preorder
- **Line Items** - Add products with variants, special notes, and line-level discounts
- **Cart Management** - Easy quantity adjustment and item editing
- **Kitchen Board** - Kanban-style order tracking (New → In Progress → Ready → Completed)

### Payment Processing
- **Multiple Payment Methods** - Cash, Card, QR Pay, and Bank Transfer
- **Split Payments** - Accept multiple payment methods for a single order
- **Cash Management** - Automatic change calculation
- **Reference Numbers** - Track non-cash payments with reference codes

### Receipts & Printing
- **Professional Receipts** - Detailed receipt with shop info, items, totals, and payments
- **Print & Reprint** - Print receipts on demand or reprint from history
- **Receipt Preview** - Review before printing

### Reporting & Analytics
- **Daily Sales Reports** - Track total sales, order count, and averages
- **Payment Breakdown** - Visual breakdown by payment method
- **Order History** - Searchable order list with filtering
- **CSV Export** - Export data for external analysis

### Offline-First Design
- **Local Storage** - All data persisted locally in browser
- **Sync Queue** - Track pending synchronization events
- **Connection Status** - Visual indicator of online/offline status
- **Resilient Operation** - Continue working even without internet

## Screen Flow

```
Login (PIN) → Open Session → Main POS ↔ Orders Board
                                ↓
                            Payment → Receipt
                                ↓
                            Reports
                                
Admin Screens (Admin only):
- Products & Categories Management
- Cashier Management
```

## Demo Users

The system comes pre-loaded with demo users:

1. **Sarah Admin**
   - Username: `admin`
   - PIN: `1234`
   - Role: ADMIN

2. **Mike Cashier**
   - Username: `mike`
   - PIN: `5678`
   - Role: CASHIER

3. **Emma Cashier**
   - Username: `emma`
   - PIN: `9999`
   - Role: CASHIER

## Design System

### Color Palette
- **Primary**: Pink (#e91e63) - Bakery-friendly accent
- **Secondary**: Orange (#ff9800) - Warm complementary
- **Success**: Green (#4caf50)
- **Warning**: Orange (#ff9800)
- **Error**: Red (#f44336)

### Spacing Grid
Built on an 8px grid system for consistent spacing:
- `--spacing-1`: 8px
- `--spacing-2`: 16px
- `--spacing-3`: 24px
- `--spacing-4`: 32px
- `--spacing-5`: 40px
- `--spacing-6`: 48px

### Touch Targets
Minimum touch target size: 44px for accessibility

### Typography
- Headings: 600-700 weight
- Body: 400 weight, 1.5 line-height
- Clear hierarchy with 4 heading levels

## Component Library

### Core Components
- **Button** - Primary, Secondary, Ghost, and Danger variants
- **Input** - Text fields with labels, errors, and helper text
- **Modal** - Overlay dialogs for focused interactions
- **StatusBadge** - Colored badges for status indicators
- **Tabs** - Horizontal tab navigation with counts
- **AppHeader** - Consistent header with shop info and status

### POS-Specific Components
- **ProductCard** - Visual product cards with quick-add
- **CartItemRow** - Cart line items with quantity controls
- **VariantModal** - Variant selection and customization
- **PaymentModal** - Split payment processing

## Responsive Design

### Tablet (Primary - 1024px)
- Optimized for 10-12 inch tablets
- Side-by-side product grid and cart
- Touch-friendly controls

### Desktop (1440px)
- Expanded grid layouts
- More products visible at once
- Enhanced admin interfaces

## Architecture

### Technologies
- **React** - UI framework
- **React Router** - Client-side routing
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icon library
- **LocalStorage** - Data persistence

### Data Flow
1. User actions trigger state updates
2. State changes saved to LocalStorage
3. Sync events queued for backend (when implemented)
4. UI reflects current local state

### Future Backend Integration
The system is designed for easy backend integration:
- Sync queue tracks all create/update operations
- Ready for Supabase or REST API connection
- Offline-first ensures uninterrupted operation

## Admin Features

Administrators have access to:
- Product and category management
- Cashier account creation and management
- Full access to all reports
- System settings

## Development Notes

### Mock Data
The app initializes with:
- 3 demo users
- 6 product categories
- 14 sample products with variants
- Empty order and session history

### Routes
- `/` - Login
- `/open-session` - Open cash session
- `/pos` - Main POS interface
- `/receipt/:orderId` - Receipt view
- `/orders` - Kitchen board
- `/admin/products` - Product management
- `/admin/cashiers` - User management
- `/reports` - Sales reports
- `/settings` - App settings
- `/ui-kit` - Design system showcase

## Deployment Considerations

### Production Checklist
- [ ] Replace mock data with real backend
- [ ] Implement actual receipt printing
- [ ] Add data backup/restore
- [ ] Set up user authentication backend
- [ ] Configure SSL for secure connections
- [ ] Test on actual tablet hardware
- [ ] Set up analytics tracking
- [ ] Implement data retention policies

### Browser Requirements
- Modern browser with LocalStorage support
- Recommended: Chrome, Safari, or Firefox
- Touch-enabled device for best experience

---

Built with ❤️ for small bakeries
