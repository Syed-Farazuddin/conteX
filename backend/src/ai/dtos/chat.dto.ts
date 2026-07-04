import { IsArray, IsNotEmpty } from "class-validator";

export class ChatDto {
  @IsArray()
  @IsNotEmpty()
  messages!: Array<Record<string, unknown>>;
}
