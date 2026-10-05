import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly previewDir = path.join(process.cwd(), 'uploads', 'previews');

  constructor(private readonly configService: ConfigService) {
    this.initDirectory();
  }

  private initDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created uploads directory at ${this.uploadDir}`);
    }
    if (!fs.existsSync(this.previewDir)) {
      fs.mkdirSync(this.previewDir, { recursive: true });
      this.logger.log(`Created previews directory at ${this.previewDir}`);
    }
  }

  async getPresignedUploadUrl(filename: string, contentType: string): Promise<{ url: string; key: string }> {
    // Mock presigned URL for local development
    const key = `uploads/${uuid()}_${filename}`;
    const url = `http://localhost:3001/api/uploads/file`;
    return { url, key };
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `${uuid()}_${file.originalname}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const endpoint = this.configService.get('API_URL', 'http://localhost:3001');
    return `${endpoint}/api/uploads/${filename}`;
  }

  /**
   * Processes a found item image for anonymous public display.
   *
   * Pipeline:
   *   Original → Resize → Grayscale → Invert (negative) → Increase contrast
   *              → Mild Gaussian blur → Save as preview
   *
   * @returns { originalUrl, previewUrl } — original is stored privately,
   *           preview is safe for public display
   */
  async uploadFoundItemImage(file: Express.Multer.File): Promise<{
    originalUrl: string;
    previewUrl: string;
    originalFilename: string;
    previewFilename: string;
  }> {
    const id = uuid();
    const ext = path.extname(file.originalname) || '.jpg';
    const originalFilename = `${id}_original${ext}`;
    const previewFilename = `${id}_preview.jpg`;

    const originalPath = path.join(this.uploadDir, originalFilename);
    const previewPath = path.join(this.previewDir, previewFilename);

    // Save original as-is
    fs.writeFileSync(originalPath, file.buffer);

    // Build processed preview: grayscale → negate → moderate blur → contrast boost
    await (sharp as any)(file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .grayscale()
      .negate()                            // invert to negative
      .linear(1.4, -30)                    // increase contrast (a * pixel + b)
      .blur(2.0)                           // mild Gaussian blur to obscure fine details
      .jpeg({ quality: 80 })
      .toFile(previewPath);

    const endpoint = this.configService.get('API_URL', 'http://localhost:3001');
    const originalUrl = `${endpoint}/api/uploads/${originalFilename}`;
    const previewUrl = `${endpoint}/api/uploads/previews/${previewFilename}`;

    return { originalUrl, previewUrl, originalFilename, previewFilename };
  }

  async deleteFile(key: string): Promise<void> {
    const filename = key.split('/').pop();
    if (filename) {
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Also clean up preview if it exists
      const previewPath = path.join(this.previewDir, filename);
      if (fs.existsSync(previewPath)) {
        fs.unlinkSync(previewPath);
      }
    }
  }
}
