export type User = {
  id: string;
  firstNameFa: string;
  lastNameFa: string;
  firstNameEn?: string;
  lastNameEn?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  educationLevel?: string;
  fieldOfStudy?: string;
  isEmployed?: boolean;
  jobTitle?: string;
  mobile: string;
  email?: string;
  languageLevel?: string;
};
