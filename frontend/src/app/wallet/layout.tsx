'use client';

import { UserPanelLayout } from '@/components/user-panel-layout';

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserPanelLayout>{children}</UserPanelLayout>;
}
