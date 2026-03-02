process.env.PORT = process.env.PORT || "3000";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/blogdb?schema=public";

