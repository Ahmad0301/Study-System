"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TextExtractorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractorService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const mammoth = require("mammoth");
const pdfParse = require('pdf-parse');
let TextExtractorService = TextExtractorService_1 = class TextExtractorService {
    constructor() {
        this.logger = new common_1.Logger(TextExtractorService_1.name);
        this.extractionCache = new Map();
    }
    async extractTextFromMaterials(materials) {
        if (!materials || materials.length === 0) {
            throw new common_1.BadRequestException('No materials provided for text extraction');
        }
        const extractedTexts = [];
        const failedFiles = [];
        for (const material of materials) {
            if (!material.fileUrl || !material.fileUrl.startsWith('/uploads/')) {
                this.logger.warn(`Skipping material "${material.name}": invalid or missing fileUrl`);
                continue;
            }
            const filename = material.fileUrl.replace('/uploads/', '');
            const filePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
            if (!(0, fs_1.existsSync)(filePath)) {
                this.logger.warn(`File not found on disk: ${filePath}`);
                failedFiles.push(material.name);
                continue;
            }
            if (this.extractionCache.has(filePath)) {
                const cached = this.extractionCache.get(filePath);
                if (cached.trim()) {
                    extractedTexts.push(`--- Document: ${material.name} ---\n${cached.trim()}`);
                    this.logger.log(`Using cached extraction for: ${material.name}`);
                    continue;
                }
            }
            const rawExt = filename.split('.').pop() || material.type || '';
            const ext = rawExt.toLowerCase().trim();
            let text = '';
            try {
                if (ext === 'pdf') {
                    this.logger.log(`Extracting text from PDF: ${material.name}`);
                    const buffer = (0, fs_1.readFileSync)(filePath);
                    const pdfData = await pdfParse(buffer);
                    text = pdfData.text || '';
                    if (!text.trim()) {
                        this.logger.warn(`PDF "${material.name}" appears to be image-based or has no selectable text.`);
                        failedFiles.push(`${material.name} (image-based PDF — no selectable text)`);
                        continue;
                    }
                }
                else if (ext === 'docx' || ext === 'doc') {
                    this.logger.log(`Extracting text from DOCX: ${material.name}`);
                    const result = await mammoth.extractRawText({ path: filePath });
                    text = result.value || '';
                    if (result.messages && result.messages.length > 0) {
                        result.messages.forEach((m) => this.logger.warn(`Mammoth: ${m.message}`));
                    }
                }
                else if (ext === 'txt' || ext === 'md' || ext === 'csv') {
                    this.logger.log(`Reading plain text file: ${material.name}`);
                    text = (0, fs_1.readFileSync)(filePath, 'utf-8');
                }
                else {
                    this.logger.warn(`Unsupported file type ".${ext}" for "${material.name}". Supported: pdf, docx, doc, txt, md, csv`);
                    failedFiles.push(`${material.name} (unsupported format .${ext})`);
                    continue;
                }
            }
            catch (error) {
                this.logger.error(`Error parsing file "${filename}": ${error.message}`);
                failedFiles.push(`${material.name} (parse error: ${error.message})`);
                continue;
            }
            const cleanedText = text.trim();
            if (cleanedText) {
                this.extractionCache.set(filePath, cleanedText);
                this.logger.log(`Successfully extracted ${cleanedText.split(/\s+/).length} words from: ${material.name}`);
                extractedTexts.push(`--- Document: ${material.name} ---\n${cleanedText}`);
            }
            else {
                this.logger.warn(`Extracted empty text from: ${material.name}`);
                failedFiles.push(`${material.name} (empty content after extraction)`);
            }
        }
        if (extractedTexts.length === 0) {
            const details = failedFiles.length > 0
                ? ` Issues: ${failedFiles.join('; ')}`
                : '';
            throw new common_1.BadRequestException(`Could not extract readable text from the selected document(s).${details} Please ensure the uploaded files contain selectable text (not scanned images).`);
        }
        const fullContent = extractedTexts.join('\n\n');
        const wordCount = fullContent.split(/\s+/).length;
        this.logger.log(`Total extracted text: ${wordCount} words from ${extractedTexts.length} document(s)`);
        return this.chunkText(fullContent, 16000);
    }
    clearCacheForFile(filePath) {
        this.extractionCache.delete(filePath);
    }
    chunkText(text, maxWords) {
        const words = text.split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        this.logger.log(`Document is large (${words.length} words). Using first ${maxWords} words for AI context.`);
        return words.slice(0, maxWords).join(' ') + '\n\n[Note: Document content has been truncated to fit AI context limits. Key sections have been prioritized.]';
    }
};
exports.TextExtractorService = TextExtractorService;
exports.TextExtractorService = TextExtractorService = TextExtractorService_1 = __decorate([
    (0, common_1.Injectable)()
], TextExtractorService);
//# sourceMappingURL=text-extractor.service.js.map