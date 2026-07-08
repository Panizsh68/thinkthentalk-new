
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  order: number;
};

export type TeamMemberFormData = Omit<TeamMember, 'id'>;
