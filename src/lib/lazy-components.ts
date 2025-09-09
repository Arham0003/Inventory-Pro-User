import dynamic from 'next/dynamic';

// Lazy load heavy chart components
export const InteractiveCharts = dynamic(
  () => import('@/components/ui/interactive-charts'),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading charts...</span>
    </div>,
    ssr: false 
  }
);

// Lazy load barcode scanner (heavy QR code libraries)
export const BarcodeScanner = dynamic(
  () => import('@/components/ui/barcode-scanner'),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading scanner...</span>
    </div>,
    ssr: false 
  }
);

// Lazy load chat widget (AI SDKs)
export const ChatWidget = dynamic(
  () => import('@/components/ui/chat-widget'),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading chat...</span>
    </div>,
    ssr: false 
  }
);

// Lazy load activity feed
export const ActivityFeed = dynamic(
  () => import('@/components/ui/activity-feed'),
  { 
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading activity...</span>
    </div>,
    ssr: false 
  }
);

// Lazy load advanced search
export const AdvancedSearch = dynamic(
  () => import('@/components/ui/advanced-search'),
  { 
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading search...</span>
    </div>,
    ssr: true 
  }
);

// Lazy load notification center
export const NotificationCenter = dynamic(
  () => import('@/components/ui/notification-center'),
  { 
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading notifications...</span>
    </div>,
    ssr: false 
  }
);

// Preload function for critical components
export const preloadCriticalComponents = () => {
  // Preload charts when user is likely to need them
  InteractiveCharts.preload?.();
  
  // Preload scanner when on products page
  if (typeof window !== 'undefined' && window.location.pathname.includes('/products')) {
    BarcodeScanner.preload?.();
  }
  
  // Preload chat for authenticated users
  if (typeof window !== 'undefined' && document.cookie.includes('auth')) {
    ChatWidget.preload?.();
  }
};

// Route-based preloading
export const routeBasedPreload = (route: string) => {
  switch (route) {
    case '/dashboard':
      InteractiveCharts.preload?.();
      ActivityFeed.preload?.();
      break;
    case '/dashboard/products':
      BarcodeScanner.preload?.();
      break;
    case '/dashboard/reports':
      InteractiveCharts.preload?.();
      break;
    default:
      break;
  }
};