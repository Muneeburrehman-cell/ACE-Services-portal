import { AppShell } from '@/components/layout/AppShell';

export default function BDLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="BD_AGENT">{children}</AppShell>;
}
