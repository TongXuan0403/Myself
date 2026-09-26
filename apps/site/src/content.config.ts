import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { publishedDirectory } from "./data/content-path";

const schema = z.object({
  id: z.string().regex(/^article-\d+-[0-9a-f]{16}$/).optional(),
  title: z.string().trim().min(1).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Invalid publication date"),
  category: z.string().trim().min(1),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().int().positive(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export const collections = {
  examples: defineCollection({
    loader: glob({ pattern: "*.md", base: "./src/content/examples" }),
    schema,
  }),
  articles: defineCollection({
    loader: glob({ pattern: "*.md", base: pathToFileURL(join(publishedDirectory, "articles")).href }),
    schema,
  }),
};
