
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Calendar, BarChart, CircleDollarSign, PlusCircle, List, Tag, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';
import { useAdminStatsQuery } from '@/hooks/use-admin-queries';

const quickActions = [
  { label: 'admin.dashboard.quickActions.createEvent', href: '/admin/events/new', icon: PlusCircle },
  { label: 'admin.dashboard.quickActions.viewRegistrations', href: '/admin/registrations', icon: List },
  { label: 'admin.dashboard.quickActions.manageDiscounts', href: '/admin/discounts', icon: Tag },
  { label: 'admin.dashboard.quickActions.viewFeedback', href: '/admin/feedback', icon: MessageSquare },
];

export default function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const { data: stats, isLoading } = useAdminStatsQuery();
  const isRTL = language === 'fa';
  
  return (
    <div className="space-y-8">
      <div className={cn(isRTL && "text-right")}>
        <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('admin.dashboard.stats.upcomingEvents')} 
          value={stats?.upcomingEvents} 
          icon={Calendar} 
          description={t('admin.dashboard.stats.upcomingEventsDesc')}
          isRTL={isRTL}
          isLoading={isLoading}
        />
        <StatCard 
          title={t('admin.dashboard.stats.totalRegistrations')} 
          value={stats?.totalRegistrations} 
          icon={Users}
          description={t('admin.dashboard.stats.totalRegistrationsDesc')}
          isRTL={isRTL}
          isLoading={isLoading}
        />
        <StatCard 
          title={t('admin.dashboard.stats.paidRegistrations')} 
          value={stats?.paidRegistrations} 
          icon={BarChart}
          description={t('admin.dashboard.stats.paidRegistrationsDesc')}
          isRTL={isRTL}
          isLoading={isLoading}
        />
        <StatCard 
          title={t('admin.dashboard.stats.totalRevenue')} 
          value={stats ? `${stats.totalRevenue.toLocaleString()} ${t('admin.currency.TOMAN')}` : undefined} 
          icon={CircleDollarSign}
          description={t('admin.dashboard.stats.totalRevenueDesc')}
          isRTL={isRTL}
          isLoading={isLoading}
        />
      </div>
      
      {/* Quick Actions */}
      <div>
         <h2 className={cn("text-xl font-semibold mb-4", isRTL && "text-right")}>{t('admin.dashboard.quickActions.title')}</h2>
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(action => (
                <Button key={action.href} asChild variant="outline" size="lg" className={cn("h-auto p-4 justify-start", isRTL && "justify-end")}>
                    <Link href={action.href} className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <action.icon className="h-6 w-6 text-primary" />
                        <span className="text-base font-medium">{t(action.label)}</span>
                    </Link>
                </Button>
            ))}
         </div>
      </div>

    </div>
  );
}

interface StatCardProps {
    title: string;
    value?: string | number;
    icon: React.ElementType;
    description: string;
    isRTL: boolean;
    isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, description, isRTL, isLoading }: StatCardProps) {
    return (
        <Card dir={isRTL ? 'rtl' : 'ltr'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <div className="text-2xl font-bold">{value ?? 'N/A'}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
