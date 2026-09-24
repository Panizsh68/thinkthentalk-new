import type { Language } from "@/lib/types";
import type { TeamMember } from "@/lib/types/team";

export type TeamMemberDisplay = {
  name: string;
  role: string;
};

export function getTeamMemberDisplay(
  member: TeamMember,
  language: Language,
): TeamMemberDisplay {
  if (language === "fa") {
    return {
      name: `${member.firstNameFa} ${member.lastNameFa}`.trim(),
      role: member.roleFa,
    };
  }

  return {
    name: `${member.firstNameEn || member.firstNameFa} ${member.lastNameEn || member.lastNameFa}`.trim(),
    role: member.roleEn || member.roleFa,
  };
}
