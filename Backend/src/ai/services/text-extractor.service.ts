import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { MaterialDocument } from '../../materials/schemas/material.schema';
import * as https from 'https';
import * as http from 'http';

// pdf-parse v1.1.1 — exports a plain async function directly
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  // In-memory cache: maps fileUrl → extracted text (cleared on restart)
  private extractionCache = new Map<string, string>();

  /**
   * Fetches a file from a URL (Cloudinary HTTPS or any HTTP URL) into a Buffer.
   */
  private async fetchFileBuffer(url: string): Promise<Buffer> {
    let targetUrl = url;
    if (targetUrl.startsWith('/')) {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3005}`;
      targetUrl = `${backendUrl.replace(/\/+$/, '')}${targetUrl}`;
    }
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch file from ${targetUrl}: HTTP ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async extractTextFromMaterials(materials: MaterialDocument[]): Promise<string> {
    if (!materials || materials.length === 0) {
      throw new BadRequestException('No materials provided for text extraction');
    }

    const extractedTexts: string[] = [];
    const failedFiles: string[] = [];

    for (const material of materials) {
      if (!material.fileUrl) {
        this.logger.warn(`Skipping material "${material.name}": missing fileUrl`);
        continue;
      }

      const fileUrl = material.fileUrl;

      // Return from cache if already extracted
      if (this.extractionCache.has(fileUrl)) {
        const cached = this.extractionCache.get(fileUrl)!;
        if (cached.trim()) {
          extractedTexts.push(`--- Document: ${material.name} ---\n${cached.trim()}`);
          this.logger.log(`Using cached extraction for: ${material.name}`);
          continue;
        }
      }

      // Determine extension from fileUrl or material.type
      const urlPath = fileUrl.split('?')[0]; // strip query params
      const rawExt = urlPath.split('.').pop() || material.type || '';
      const ext = rawExt.toLowerCase().trim();

      let text = '';

      try {
        this.logger.log(`Fetching file from URL: ${fileUrl}`);
        const buffer = await this.fetchFileBuffer(fileUrl);

        if (ext === 'pdf') {
          this.logger.log(`Extracting text from PDF: ${material.name}`);
          const pdfData = await pdfParse(buffer);
          text = pdfData.text || '';

          if (!text.trim()) {
            this.logger.warn(`PDF "${material.name}" appears to be image-based or has no selectable text.`);
            failedFiles.push(`${material.name} (image-based PDF — no selectable text)`);
            continue;
          }
        } else if (ext === 'docx' || ext === 'doc') {
          this.logger.log(`Extracting text from DOCX: ${material.name}`);
          const result = await mammoth.extractRawText({ buffer });
          text = result.value || '';

          if (result.messages && result.messages.length > 0) {
            result.messages.forEach((m) => this.logger.warn(`Mammoth: ${m.message}`));
          }
        } else if (ext === 'txt' || ext === 'md' || ext === 'csv') {
          this.logger.log(`Reading plain text file: ${material.name}`);
          text = buffer.toString('utf-8');
        } else {
          this.logger.warn(`Unsupported file type ".${ext}" for "${material.name}". Supported: pdf, docx, doc, txt, md, csv`);
          failedFiles.push(`${material.name} (unsupported format .${ext})`);
          continue;
        }
      } catch (error: any) {
        this.logger.error(`Error fetching/parsing file "${material.name}": ${error.message}`);
        failedFiles.push(`${material.name} (fetch/parse error: ${error.message})`);
        continue;
      }

      const cleanedText = text.trim();
      if (cleanedText) {
        // Cache this extraction
        this.extractionCache.set(fileUrl, cleanedText);
        this.logger.log(`Successfully extracted ${cleanedText.split(/\s+/).length} words from: ${material.name}`);
        extractedTexts.push(`--- Document: ${material.name} ---\n${cleanedText}`);
      } else {
        this.logger.warn(`Extracted empty text from: ${material.name}`);
        failedFiles.push(`${material.name} (empty content after extraction)`);
      }
    }

    if (extractedTexts.length === 0) {
      const details = failedFiles.length > 0
        ? ` Issues: ${failedFiles.join('; ')}`
        : '';
      throw new BadRequestException(
        `Could not extract readable text from the selected document(s).${details} Please ensure the uploaded files contain selectable text (not scanned images).`,
      );
    }

    const fullContent = extractedTexts.join('\n\n');
    const wordCount = fullContent.split(/\s+/).length;
    this.logger.log(`Total extracted text: ${wordCount} words from ${extractedTexts.length} document(s)`);

    // Chunk to model's context limit — 16,000 words for high quality
    return this.chunkText(fullContent, 16000);
  }

  /**
   * Clears the in-memory extraction cache for a given fileUrl.
   */
  clearCacheForFile(fileUrl: string) {
    this.extractionCache.delete(fileUrl);
  }

  private chunkText(text: string, maxWords: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) {
      return text;
    }
    this.logger.log(`Document is large (${words.length} words). Using first ${maxWords} words for AI context.`);
    return words.slice(0, maxWords).join(' ') + '\n\n[Note: Document content has been truncated to fit AI context limits. Key sections have been prioritized.]';
  }
}
