
export type Sponsor = {
  id: string;
  name: string;
  productOrTagline: string;
  logoUrl: string;
  websiteUrl?: string;
};

export type SponsorFormData = Omit<Sponsor, 'id'>;
