import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { getStorage } from 'firebase-admin/storage';

@Controller('uploads')
export class UploadsController {
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    try {
      const bucket = getStorage().bucket();
      const objectName = `${Date.now() + file.originalname}`;
      await bucket.file(objectName).save(file.buffer);
      const url = `https://firebasestorage.googleapis.com/v0/b/snapsnacks-f4123.appspot.com/o/${objectName}?alt=media`;
      return { url };
    } catch (e) {
      console.log(e);
    }
  }
}
