import { Transform } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@ApiSchema({ name: 'RegisterRequest' })
export class RegisterUserRequest {
  @ApiProperty({ example: 'Ada Lovelace', maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({
    example: 'ada.lovelace@example.test',
    format: 'email',
    maxLength: 254,
  })
  @Transform(trimString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'GameBook@2026',
    format: 'password',
    minLength: 8,
    pattern: '^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'GameBook@2026',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  passwordConfirmation!: string;
}
