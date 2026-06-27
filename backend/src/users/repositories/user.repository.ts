import { UserEntity } from '../entities/user.entity';

export interface CreateOrUpdateUserProfileDto {
  mobile: string;
  firstNameFa?: string;
  lastNameFa?: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  age?: number | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  isEmployed?: boolean | null;
  jobTitle?: string | null;
  email?: string | null;
  languageLevel?: string | null;
}

export interface UpdateUserProfileDto {
  firstNameFa?: string;
  lastNameFa?: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  age?: number | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  isEmployed?: boolean | null;
  jobTitle?: string | null;
  email?: string | null;
  languageLevel?: string | null;
}

export abstract class IUserRepository {
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByMobile(mobile: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract createOrUpdateFromOtpProfile(
    dto: CreateOrUpdateUserProfileDto,
  ): Promise<UserEntity>;
  abstract updateProfile(
    id: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserEntity>;
  abstract createUserWithEmailPassword(
    email: string,
    passwordHash: string,
  ): Promise<UserEntity>;
}
