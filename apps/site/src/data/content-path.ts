import { resolve } from "node:path";

export const publishedDirectory = resolve(process.env.MYSELF_CONTENT_DIR ?? "src/content/published");
