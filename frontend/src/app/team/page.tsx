'use client';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useTeamMembersQuery } from '@/hooks/use-team-queries';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

function TeamMemberCard({ member }: { member: { id: string; name: string; role: string; photoUrl: string } }) {
  return (
    <div className="text-center">
      <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-background shadow-md">
        <AvatarImage src={member.photoUrl} alt={member.name} />
        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <h3 className="text-lg font-bold">{member.name}</h3>
      <p className="text-muted-foreground">{member.role}</p>
    </div>
  );
}

export default function TeamPage() {
  const { t } = useLanguage();
  const { data: team, isLoading, error } = useTeamMembersQuery();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-4 w-24 mt-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      );
    }
    if (error) {
      return <p className="text-destructive text-center">{t('errors.genericTitle')}</p>;
    }
    if (!team || team.length === 0) {
      return <p className="text-center text-muted-foreground">{t('home.team.noMembers')}</p>;
    }

    return (
      <>
        <div className="md:hidden overflow-x-auto pb-4">
          <div className="flex gap-4">
            {[...team].sort((a, b) => a.order - b.order).map(member => (
              <div key={member.id} className="w-[50%] sm:w-[40%] shrink-0">
                <TeamMemberCard member={member} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
          {[...team].sort((a, b) => a.order - b.order).map(member => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="py-16">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-h1">{t('home.team.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('home.team.subtitle')}</p>
        </div>
        {renderContent()}
      </div>
    </main>
  );
}
