import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    format: 'email',
    example: 'admin@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    format: 'password',
    minLength: 6,
    example: 'strongPassword123',
  })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
