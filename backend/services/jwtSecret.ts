const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production"
    );
  }
  return "dev_secret_do_not_use_in_production";
};

export const JWT_SECRET = getJwtSecret();
