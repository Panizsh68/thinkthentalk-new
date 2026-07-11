'use client';

import { CoinCenterMaintenance } from '@/components/coin-center-maintenance';
import { WalletPageContent } from '@/components/wallet-page-content';
import { isCoinCenterEnabled } from '@/lib/config/features';

export default function WalletPage() {
  if (isCoinCenterEnabled()) {
    return <WalletPageContent />;
  }

  return (
    <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <CoinCenterMaintenance />
    </div>
  );
}
