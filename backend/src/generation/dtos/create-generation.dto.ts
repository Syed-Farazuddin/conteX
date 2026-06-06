import { IsNotEmpty, IsOptional, IsString, IsEmail } from "class-validator";

export class CreateGenerationDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsString()
  @IsNotEmpty()
  style!: string;

  @IsOptional()
  @IsEmail()
  userEmail?: string;
}
