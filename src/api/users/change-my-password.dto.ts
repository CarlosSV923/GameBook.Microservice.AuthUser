import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeMyPasswordRequest {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
