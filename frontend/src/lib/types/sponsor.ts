export type Sponsor = {
  id: string;
  name: string;
  productOrTagline: string;
  logoUrl: string;
  websiteUrl?: string | null;
};

export type SponsorFormData = {
  name: string;
  productOrTagline: string;
  logoUrl: string;
  websiteUrl?: string;
};
