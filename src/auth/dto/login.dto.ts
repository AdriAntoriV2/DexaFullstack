
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'employee@company.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  companyEmail!: string;

  @ApiProperty({
    example: 'ExamplePassword123',
    minLength: 1,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
