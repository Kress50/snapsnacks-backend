"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const path_1 = require("path");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const Joi = require("joi");
const users_module_1 = require("./users/users.module");
const common_module_1 = require("./common/common.module");
const user_entity_1 = require("./users/entities/user.entity");
const jwt_module_1 = require("./jwt/jwt.module");
const auth_module_1 = require("./auth/auth.module");
const verification_entity_1 = require("./users/entities/verification.entity");
const mail_module_1 = require("./mail/mail.module");
const restaurant_entity_1 = require("./restaurants/entities/restaurant.entity");
const category_entity_1 = require("./restaurants/entities/category.entity");
const restaurants_module_1 = require("./restaurants/restaurants.module");
const dish_entity_1 = require("./restaurants/entities/dish.entity");
const orders_module_1 = require("./orders/orders.module");
const order_entity_1 = require("./orders/entities/order.entity");
const order_item_dto_1 = require("./orders/entities/order-item.dto");
const payments_module_1 = require("./payments/payments.module");
const payment_entity_1 = require("./payments/entities/payment.entity");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: process.env.NODE_ENV === 'dev'
                    ? '.env.development.local'
                    : '.env.test.local',
                ignoreEnvFile: process.env.NODE_ENV === 'prod',
                validationSchema: Joi.object({
                    NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
                    DB_HOST: Joi.string().required(),
                    DB_PORT: Joi.string().required(),
                    DB_USERNAME: Joi.string().required(),
                    DB_PASSWORD: Joi.string().required(),
                    DB_NAME: Joi.string().required(),
                    PRIVATE_KEY: Joi.string().required(),
                    MAIL_API: Joi.string().required(),
                    MAIL_DOMAIN: Joi.string().required(),
                    MAIL_FROM: Joi.string().required(),
                }),
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                subscriptions: {
                    'subscriptions-transport-ws': {
                        onConnect(connectionParams) {
                            const TOKEN_KEY = 'x-jwt';
                            return { token: connectionParams[TOKEN_KEY] };
                        },
                    },
                },
                context: ({ req, connection }) => {
                    const TOKEN_KEY = 'x-jwt';
                    if (req) {
                        return { token: req.headers[TOKEN_KEY] };
                    }
                    else if (connection) {
                        console.log(connection.context);
                    }
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: +process.env.DB_POST,
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                synchronize: process.env.NODE_ENV !== 'prod',
                logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
                entities: [
                    user_entity_1.User,
                    verification_entity_1.Verification,
                    restaurant_entity_1.Restaurant,
                    category_entity_1.Category,
                    dish_entity_1.Dish,
                    order_entity_1.Order,
                    order_item_dto_1.OrderItem,
                    payment_entity_1.Payment,
                ],
            }),
            jwt_module_1.JwtModule.forRoot({
                privateKey: process.env.PRIVATE_KEY,
            }),
            mail_module_1.MailModule.forRoot({
                apiKey: process.env.MAIL_API,
                domain: process.env.MAIL_DOMAIN,
                fromEmail: process.env.MAIL_FROM,
            }),
            auth_module_1.AuthModule,
            common_module_1.CommonModule,
            restaurants_module_1.RestaurantsModule,
            users_module_1.UsersModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map