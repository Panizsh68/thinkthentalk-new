'use client';
import { useLanguage } from "@/lib/i18n/language-provider";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users2 } from "lucide-react";

export function TeamSection() {
  const { t } = useLanguage();
  const { data: team, isLoading } = useTeamMembersQuery();

  return (
    <section className="py-20 md:py-32 border-b border-border/40 px-4">
      <div className="container max-w-screen-2xl text-center">
        <div className="mb-16 space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('home.team.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">{t('home.team.subtitle')}</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-40 w-40 rounded-full mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        ) : team && team.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map(member => (
              <div key={member.id} className="space-y-4 group">
                <div className="relative h-48 w-48 mx-auto rounded-3xl overflow-hidden shadow-md transform transition-all group-hover:scale-105">
                   <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                      <AvatarFallback className="text-2xl font-bold">{member.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-6 rounded-[2rem] border-2 border-dashed bg-muted/20 max-w-md mx-auto">
            <Users2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('home.team.noMembers')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
