import { ApiProperty } from '@nestjs/swagger';
import { AdminUserDto } from '../../admin/dto/admin-user.dto';

export class AdminAuthResponseDto {
  @ApiProperty({ description: 'A session token (e.g., JWT).' })
  token!: string;

  @ApiProperty({ type: () => AdminUserDto })
  user!: AdminUserDto;
}
