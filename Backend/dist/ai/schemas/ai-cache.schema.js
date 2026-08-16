"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiCacheSchema = exports.AiCache = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AiCache = class AiCache {
};
exports.AiCache = AiCache;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], AiCache.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], AiCache.prototype, "subjectId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], AiCache.prototype, "fileIdsKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['summary', 'chat', 'flashcards', 'quiz'] }),
    __metadata("design:type", String)
], AiCache.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, required: true }),
    __metadata("design:type", Object)
], AiCache.prototype, "data", void 0);
exports.AiCache = AiCache = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AiCache);
exports.AiCacheSchema = mongoose_1.SchemaFactory.createForClass(AiCache);
exports.AiCacheSchema.index({ userId: 1, subjectId: 1, type: 1 });
//# sourceMappingURL=ai-cache.schema.js.map