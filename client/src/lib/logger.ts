import { config } from "dotenv";
config();

export const debugLog = (...args: unknown[]) => {
  if (process.env.DEV) {
    console.log(...args);
  }
};
