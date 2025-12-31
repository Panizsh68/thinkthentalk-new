import { ApiProperty } from '@nestjs/swagger';

export class ContactSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    example: "Your message has been sent. We'll get back to you soon.",
  })
  message!: string;
}
