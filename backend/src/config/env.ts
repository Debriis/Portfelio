import "dotenv/config";
export const env = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "127.0.0.1",
  origins: (
    process.env.CORS_ORIGIN || "http://localhost:5178,http://127.0.0.1:5178"
  ).split(","),
};
