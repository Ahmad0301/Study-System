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
exports.GeneralChatSessionSchema = exports.GeneralChatSession = exports.GeneralChatMessageItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
class GeneralChatMessageItem {
}
exports.GeneralChatMessageItem = GeneralChatMessageItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GeneralChatMessageItem.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['user', 'ai', 'assistant'] }),
    __metadata("design:type", String)
], GeneralChatMessageItem.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GeneralChatMessageItem.prototype, "text", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GeneralChatMessageItem.prototype, "timestamp", void 0);
let GeneralChatSession = class GeneralChatSession {
};
exports.GeneralChatSession = GeneralChatSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], GeneralChatSession.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'StudyAI Assistant Chat' }),
    __metadata("design:type", String)
], GeneralChatSession.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Array, default: [] }),
    __metadata("design:type", Array)
], GeneralChatSession.prototype, "messages", void 0);
exports.GeneralChatSession = GeneralChatSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], GeneralChatSession);
exports.GeneralChatSessionSchema = mongoose_1.SchemaFactory.createForClass(GeneralChatSession);
//# sourceMappingURL=general-chat-session.schema.js.map