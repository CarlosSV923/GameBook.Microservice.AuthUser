import { Transform } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@ApiSchema({ name: 'LoginRequest' })
export class LoginUserRequest {
  @ApiProperty({
    example: 'ada.lovelace@example.test',
    format: 'email',
    maxLength: 254,
  })
  @Transform(trimString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'GameBook@2026', format: 'password', minLength: 1 })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
