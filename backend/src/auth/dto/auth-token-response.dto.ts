import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'A session token (e.g., JWT).' })
  token!: string;

  @ApiProperty({ type: () => UserDto })
  user!: UserDto;
}
