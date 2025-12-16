import * as joi from "joi";

export const validationSchema = joi.object({
  STAGE: joi.string().valid("dev", "prod", "test", "").default(""),
  PORT: joi.number().default(3001),
  JWT_SECRET: joi.string().required(),
  JWT_EXPIRATION_TIME: joi.number().default(3600),
  MONGODB_URI: joi.string().required(),
  CORS_ORIGIN: joi.string().required(),
});
