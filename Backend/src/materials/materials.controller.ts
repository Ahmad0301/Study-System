import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MulterFile } from '../cloudinary/cloudinary.service';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // keeps file in RAM buffer → passed to Cloudinary
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  uploadFile(
    @Req() req: Request,
    @Body('subjectId') subjectId: string,
    @Body('name') name: string,
    @UploadedFile() file: MulterFile,
  ) {
    const userId = (req as any).user.sub;
    return this.materialsService.create(userId, subjectId, name, file);
  }

  @Get('subject/:subjectId')
  findBySubject(@Req() req: Request, @Param('subjectId') subjectId: string) {
    const userId = (req as any).user.sub;
    return this.materialsService.findBySubject(userId, subjectId);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.materialsService.remove(userId, id);
  }
}
