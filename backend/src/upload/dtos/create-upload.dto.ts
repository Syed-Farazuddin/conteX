import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateUploadDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url!: string;
}
