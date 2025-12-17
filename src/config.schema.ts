import * as joi from "joi";

export const validationSchema = joi.object({
  STAGE: joi.string().valid("dev", "prod", "test", "").default(""),
  PORT: joi.number().default(7777),
  JWT_SECRET: joi.string().required(),
  JWT_EXPIRATION_TIME: joi.number().default(3600),
  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().default(5432),
  DB_USERNAME: joi.string().required(),
  DB_PASSWORD: joi.string().required(),
  DB_NAME: joi.string().required(),
  REDIS_HOST: joi.string().required(),
  REDIS_PORT: joi.number().default(6379),
  CORS_ORIGIN: joi.string().required(),
});
