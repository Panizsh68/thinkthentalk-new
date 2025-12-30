
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
};

export type TeamMemberFormData = Omit<TeamMember, 'id'>;
