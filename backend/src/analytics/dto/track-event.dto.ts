import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class TrackEventDto {
  @IsString()
  @MaxLength(80)
  eventType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  source?: string; // "web" | "app"

  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}
