import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  organizationName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshDto {
  // Optional in body — web sends it via httpOnly cookie instead.
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
