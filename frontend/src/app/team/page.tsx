"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import type { TeamMember } from "@/lib/types";
import { getTeamMemberDisplay } from "@/lib/team-display";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function TeamMemberCard({
  member,
  language,
}: {
  member: TeamMember;
  language: "fa" | "en";
}) {
  const display = getTeamMemberDisplay(member, language);
  return (
    <div className="text-center">
      <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-background shadow-md">
        <AvatarImage src={member.avatarUrl ?? undefined} alt={display.name} />
        <AvatarFallback>{display.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <h3 className="text-lg font-bold">{display.name}</h3>
      <p className="text-muted-foreground">{display.role}</p>
    </div>
  );
}

export default function TeamPage() {
  const { t, language } = useLanguage();
  const { data: team, isLoading, error, refetch } = useTeamMembersQuery();

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
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive" role="alert">
            {t("home.team.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            {t("actions.retry")}
          </Button>
        </div>
      );
    }
    if (!team || team.length === 0) {
      return (
        <p className="text-center text-muted-foreground">
          {t("home.team.noMembers")}
        </p>
      );
    }

    return (
      <>
        <div className="md:hidden overflow-x-auto pb-4">
          <div className="flex gap-4">
            {[...team]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((member) => (
                <div key={member.id} className="w-[50%] sm:w-[40%] shrink-0">
                  <TeamMemberCard member={member} language={language} />
                </div>
              ))}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
          {[...team]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                language={language}
              />
            ))}
        </div>
      </>
    );
  };

  return (
    <main className="py-16">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-h1">{t("home.team.title")}</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            {t("home.team.subtitle")}
          </p>
        </div>
        {renderContent()}
      </div>
    </main>
  );
}
