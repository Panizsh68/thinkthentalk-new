export type TeamMember = {
  id: string;
  firstNameFa: string;
  lastNameFa: string;
  roleFa: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  roleEn: string | null;
  avatarUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberFormData = {
  firstNameFa: string;
  lastNameFa: string;
  roleFa: string;
  firstNameEn: string;
  lastNameEn: string;
  roleEn: string;
  avatarUrl: string;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateTeamMemberData = Partial<TeamMemberFormData>;
