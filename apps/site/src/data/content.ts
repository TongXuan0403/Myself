import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
import { z } from "zod";
import { publishedDirectory } from "./content-path";
import * as examples from "./examples";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const snapshotSchema = z.object({
  version: z.literal(1),
  articles: z.array(z.string().regex(/^article-\d+-[0-9a-f]{16}$/)),
  collections: z.array(z.object({
    title: z.string().trim().min(1), slug, description: z.string(), audience: z.string(),
    stages: z.array(z.string()), done: z.number().int().nonnegative(),
  }).refine((item) => item.done <= item.stages.length, "Invalid collection progress")),
  projects: z.array(z.object({
    name: z.string().trim().min(1), slug, summary: z.string(),
    status: z.enum(["idea", "building", "online"]), stack: z.array(z.string()),
    result: z.string(), link: z.string(),
  })),
  notes: z.array(z.object({
    date, type: z.string().trim().min(1), title: z.string().trim().min(1),
    summary: z.string(), tags: z.array(z.string()),
  })),
});

const snapshotPath = join(publishedDirectory, "snapshot.json");
const snapshot = existsSync(snapshotPath)
  ? snapshotSchema.parse(JSON.parse(readFileSync(snapshotPath, "utf8")))
  : undefined;
const [exampleEntries, publishedEntries] = await Promise.all([
  snapshot ? Promise.resolve([]) : getCollection("examples"),
  snapshot?.articles.length ? getCollection("articles") : Promise.resolve([]),
]);
const byId = new Map(publishedEntries.map((entry) => [entry.data.id ?? entry.id, entry]));
const entries = snapshot ? snapshot.articles.map((id) => {
  const entry = byId.get(id);
  if (!entry) throw new Error(`Public snapshot references missing Markdown: ${id} (available: ${[...byId.keys()].join(", ")})`);
  if (entry.data.draft) throw new Error(`Public snapshot references a draft: ${id}`);
  return entry;
}) : exampleEntries.filter((entry) => !entry.data.draft);

function requireUniqueSlugs(items: { slug: string }[], label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.slug)) throw new Error(`Duplicate ${label} slug: ${item.slug}`);
    seen.add(item.slug);
  }
}

export type PublicArticle = CollectionEntry<"articles" | "examples">["data"] & {
  entry: CollectionEntry<"articles" | "examples">;
};
export const articles: PublicArticle[] = entries
  .map((entry) => ({ ...entry.data, entry }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
requireUniqueSlugs(articles, "article");

export const series = (snapshot?.collections ?? examples.series)
  .map((item) => ({ ...item, count: item.stages.length }));
const projectStatuses = { idea: "构思中", building: "开发中", online: "已上线" };
export const projects = snapshot ? snapshot.projects.map((item) => ({
  ...item, status: projectStatuses[item.status],
})) : examples.projects.map((item) => ({ ...item, link: "" }));
export const notes = snapshot?.notes ?? examples.notes;
requireUniqueSlugs(series, "collection");
requireUniqueSlugs(projects, "project");

export function safeProjectLink(link: string): string | undefined {
  if (!link) return undefined;
  try {
    const url = new URL(link.startsWith("github.com/") ? `https://${link}` : link);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
