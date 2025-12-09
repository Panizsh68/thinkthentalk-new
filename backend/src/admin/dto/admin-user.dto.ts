import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';

export class AdminUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AdminRole })
  role!: AdminRole;
}
