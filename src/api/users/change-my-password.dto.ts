import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ChangePasswordRequest' })
export class ChangeMyPasswordRequest {
  @ApiProperty({
    description: 'Current password; it is never logged or returned.',
    example: 'GameBook@2026',
    format: 'password',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    description:
      'At least 8 characters, including uppercase, digit and special character.',
    example: 'GameBook#2027',
    format: 'password',
    minLength: 8,
    pattern: '^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
