"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
        setHeaders: (res, filePath) => {
            res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            const lower = filePath.toLowerCase();
            if (lower.endsWith('.pdf')) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline');
            }
            else if (lower.endsWith('.docx')) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', 'inline');
            }
            else if (lower.endsWith('.doc')) {
                res.setHeader('Content-Type', 'application/msword');
                res.setHeader('Content-Disposition', 'inline');
            }
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    const port = process.env.PORT || 3005;
    await app.listen(port);
    console.log(`🚀 Auth backend running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map