export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly mobile: string,
    public readonly firstNameFa: string,
    public readonly lastNameFa: string,
    public readonly firstNameEn?: string | null,
    public readonly lastNameEn?: string | null,
    public readonly gender?: string | null,
    public readonly age?: number | null,
    public readonly educationLevel?: string | null,
    public readonly fieldOfStudy?: string | null,
    public readonly isEmployed?: boolean | null,
    public readonly jobTitle?: string | null,
    public readonly email?: string | null,
    public readonly languageLevel?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
