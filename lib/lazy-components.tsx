import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Lazy load heavy chart components
export const InteractiveCharts = dynamic(
  () => import('@/components/ui/interactive-charts').then(mod => mod.InteractiveChart as ComponentType<any>),
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
  () => import('@/components/ui/barcode-scanner').then(mod => mod.BarcodeScanner as ComponentType<any>),
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
  () => import('@/components/ui/chat-widget').then(mod => mod.ChatWidget as ComponentType<any>),
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
  () => import('@/components/ui/activity-feed').then(mod => mod.ActivityFeed as ComponentType<any>),
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
  () => import('@/components/ui/advanced-search').then(mod => mod.AdvancedSearch as ComponentType<any>),
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
  () => import('@/components/ui/notification-center').then(mod => mod.NotificationCenter as ComponentType<any>),
  { 
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading notifications...</span>
    </div>,
    ssr: false 
  }
);