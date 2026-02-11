import { createBrowserRouter } from 'react-router-dom';
import { PinLogin } from './screens/PinLogin';
import { OpenCashSession } from './screens/OpenCashSession';
import { MainPOS } from './screens/MainPOS';
import { Receipt } from './screens/Receipt';
import { Orders } from './screens/Orders';
import { AdminProducts } from './screens/AdminProducts';
import { AdminCashiers } from './screens/AdminCashiers';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';
import { UIKit } from './screens/UIKit';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PinLogin,
  },
  {
    path: '/open-session',
    Component: OpenCashSession,
  },
  {
    path: '/pos',
    Component: MainPOS,
  },
  {
    path: '/receipt/:orderId',
    Component: Receipt,
  },
  {
    path: '/orders',
    Component: Orders,
  },
  {
    path: '/admin/products',
    Component: AdminProducts,
  },
  {
    path: '/admin/cashiers',
    Component: AdminCashiers,
  },
  {
    path: '/reports',
    Component: Reports,
  },
  {
    path: '/settings',
    Component: Settings,
  },
  {
    path: '/ui-kit',
    Component: UIKit,
  },
]);