import { Body, Controller, Post } from "@nestjs/common";
import { UploadService } from "./upload.service.js";
import { CreateUploadDto } from "./dtos/create-upload.dto.js";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async receive(@Body() body: CreateUploadDto) {
    return this.uploadService.createUpload(body);
  }
}
