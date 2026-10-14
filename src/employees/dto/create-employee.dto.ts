
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'employee@company.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  companyEmail!: string;

  @ApiProperty({ example: 'ExamplePassword123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Example Employee', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  fullName!: string;

  @ApiProperty({ example: 'Software Engineer', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  position!: string;

  @ApiPropertyOptional({ example: '+628123456789', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}
