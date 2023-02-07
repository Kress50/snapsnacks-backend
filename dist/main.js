"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_1 = require("firebase-admin/app");
const app_2 = require("firebase-admin/app");
const app_module_1 = require("./app.module");
(0, app_2.initializeApp)({
    credential: (0, app_1.cert)(JSON.parse(process.env.FIREBASE)),
    storageBucket: 'snapsnacks-f4123.appspot.com',
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.enableCors();
    await app.listen(process.env.PORT || 4000);
}
bootstrap();
//# sourceMappingURL=main.js.map