import { User } from '@prisma/client';
import { UserDto } from '../dto/user.dto';
import { UserEntity } from '../entities/user.entity';

export const toUserEntity = (user: User): UserEntity =>
  new UserEntity(
    user.id,
    user.mobile,
    user.firstNameFa,
    user.lastNameFa,
    user.firstNameEn,
    user.lastNameEn,
    user.gender,
    user.age,
    user.educationLevel,
    user.fieldOfStudy,
    user.isEmployed,
    user.jobTitle,
    user.email,
    user.languageLevel,
    user.avatarUrl,
    user.password,
    user.createdAt,
    user.updatedAt,
  );

export const toUserDto = (user: UserEntity): UserDto => ({
  id: user.id,
  firstNameFa: user.firstNameFa,
  lastNameFa: user.lastNameFa,
  firstNameEn: user.firstNameEn ?? undefined,
  lastNameEn: user.lastNameEn ?? undefined,
  gender: user.gender ?? undefined,
  age: user.age ?? undefined,
  educationLevel: user.educationLevel ?? undefined,
  fieldOfStudy: user.fieldOfStudy ?? undefined,
  isEmployed: user.isEmployed ?? undefined,
  jobTitle: user.jobTitle ?? undefined,
  mobile: user.mobile,
  email: user.email ?? undefined,
  languageLevel: user.languageLevel ?? undefined,
  avatarUrl: user.avatarUrl ?? undefined,
});
