import "express";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string; // or number if your JWT stores numeric IDs
  }
}
