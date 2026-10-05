import {
  Controller, Post, Get, Body, UploadedFile, UseInterceptors,
  UseGuards, Param, Res, HttpException, HttpStatus,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import * as path from 'path';
import * as fs from 'fs';

/** Sanitize a bare filename: no slashes, no dots at the start, no null bytes */
function sanitizeFilename(raw: string): string {
  const name = path.basename(raw.replace(/\0/g, ''));   // strip null bytes & path components
  if (!name || name.startsWith('.')) {
    throw new BadRequestException('Invalid filename');
  }
  return name;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for file upload' })
  async getPresignedUrl(@Body() body: { filename: string; contentType: string }) {
    const result = await this.uploadsService.getPresignedUploadUrl(body.filename, body.contentType);
    return { success: true, data: result };
  }

  @Post('file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file directly' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|avif|svg\+xml)$/ }),
        ],
      }),
    ) file: Express.Multer.File
  ) {
    if (!file) throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    const url = await this.uploadsService.uploadFile(file);
    return { success: true, data: { url } };
  }

  /**
   * Upload a found item image.
   * Returns both a private originalUrl and a public previewUrl (anonymised).
   * The preview is grayscale-negative-blurred so the item cannot be identified.
   */
  @Post('found-item-image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload found item image — returns original + anonymised preview' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async uploadFoundItemImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|avif)$/ }),
        ],
      }),
    ) file: Express.Multer.File
  ) {
    if (!file) throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);

    const result = await this.uploadsService.uploadFoundItemImage(file);
    return { success: true, data: result };
  }

  @Get('previews/:filename')
  @ApiOperation({ summary: 'Serve a processed preview image (public)' })
  getPreview(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = sanitizeFilename(filename);
    const previewRoot = path.resolve(process.cwd(), 'uploads', 'previews');
    const filePath = path.join(previewRoot, safeName);
    // Ensure the resolved path is still inside the previews directory
    if (!filePath.startsWith(previewRoot)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Preview not found' });
    }
    res.sendFile(safeName, { root: previewRoot });
  }

  @Get(':filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an uploaded file (authenticated)' })
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = sanitizeFilename(filename);
    const uploadRoot = path.resolve(process.cwd(), 'uploads');
    const filePath = path.join(uploadRoot, safeName);
    // Ensure the resolved path is still inside uploads
    if (!filePath.startsWith(uploadRoot)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.sendFile(safeName, { root: uploadRoot });
  }
}

