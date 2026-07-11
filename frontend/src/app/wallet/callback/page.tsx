'use client';

import { CoinCenterMaintenance } from '@/components/coin-center-maintenance';
import { WalletCallbackContent } from '@/components/wallet-callback-content';
import { isCoinCenterEnabled } from '@/lib/config/features';

export default function WalletCallbackPage() {
  return (
    <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      {isCoinCenterEnabled() ? <WalletCallbackContent /> : <CoinCenterMaintenance compact />}
    </div>
  );
}
