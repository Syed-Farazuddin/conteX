import { IsNotEmpty, IsString } from "class-validator";

export class PlanPipelineDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}
