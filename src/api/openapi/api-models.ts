import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ErrorDetail' })
export class ErrorDetailModel {
  @ApiProperty({ example: 'password' })
  field!: string;

  @ApiProperty({ example: 'INVALID_VALUE' })
  reason!: string;
}

@ApiSchema({ name: 'ErrorResponse' })
export class ErrorResponseModel {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Request validation failed.' })
  message!: string;

  @ApiProperty({ example: 'req_gb007_fictitious' })
  requestId!: string;

  @ApiPropertyOptional({ type: [ErrorDetailModel] })
  details?: ErrorDetailModel[];
}

@ApiSchema({ name: 'UserIdentity' })
export class UserIdentityModel {
  @ApiProperty({
    format: 'uuid',
    example: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  })
  id!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  fullName!: string;

  @ApiProperty({ format: 'email', example: 'ada.lovelace@example.test' })
  email!: string;
}

@ApiSchema({ name: 'UserResponse' })
export class UserResponseModel {
  @ApiProperty({ type: UserIdentityModel })
  user!: UserIdentityModel;
}

@ApiSchema({ name: 'LoginResponse' })
export class LoginResponseModel extends UserResponseModel {
  @ApiProperty({ example: 'fictional.jwt.token' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;
}

@ApiSchema({ name: 'SessionResponse' })
export class SessionResponseModel {
  @ApiProperty({ type: UserIdentityModel })
  user!: UserIdentityModel;
}
