import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const siteDirectory = fileURLToPath(new URL("../", import.meta.url));
const astroCli = fileURLToPath(new URL("../../../node_modules/astro/bin/astro.mjs", import.meta.url));

function fixture() {
  const root = mkdtempSync(join(siteDirectory, ".tmp-content-build-"));
  const content = join(root, "published");
  mkdirSync(join(content, "articles"), { recursive: true });
  return { root, content, output: join(root, "site") };
}

/** @param {ReturnType<typeof fixture>} environment */
function build(environment) {
  return spawnSync(process.execPath, [astroCli, "build", "--outDir", environment.output], {
    cwd: siteDirectory,
    env: { ...process.env, MYSELF_CONTENT_DIR: environment.content },
    encoding: "utf8",
  });
}

/** @param {ReturnType<typeof fixture>} environment
 * @param {Record<string, unknown>} [overrides]
 */
function snapshot(environment, overrides = {}) {
  writeFileSync(join(environment.content, "snapshot.json"), JSON.stringify({
    version: 1, articles: [], collections: [], projects: [], notes: [], ...overrides,
  }));
}

/** @param {ReturnType<typeof fixture>} environment
 * @param {string} id
 * @param {Record<string, unknown>} [overrides]
 * @param {string} [body]
 */
function markdown(environment, id, overrides = {}, body = "Public body") {
  const metadata = {
    id,
    title: "Published Markdown", slug: "published-markdown", description: "Verified content",
    date: "2026-09-26", category: "Quality", tags: ["Markdown"], readingTime: 3,
    featured: true, draft: false, ...overrides,
  };
  writeFileSync(join(environment.content, "articles", id + ".md"),
    "---\n" + JSON.stringify(metadata) + "\n---\n\n" + body);
}

const publicId = "article-1-0123456789abcdef";

test("without a snapshot, curated Markdown examples still build", () => {
  const env = fixture();
  try {
    const result = build(env);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(existsSync(join(env.output, "articles/build-personal-blog/index.html")));
  } finally { rmSync(env.root, { recursive: true, force: true }); }
});

test("only referenced published content renders, with safe highlighted Markdown", () => {
  const env = fixture();
  try {
    markdown(env, publicId, {}, [
      "## Rendered Markdown", "- First\n- Second",
      "| Name | State |\n| --- | --- |\n| Markdown | Ready |",
      "```ts\nconst ready = true;\n```",
      '<script>window.__unsafe=1</script>',
      '[unsafe](javascript:alert(1))',
      '<span style="position:fixed;inset:0">Overlay</span>',
    ].join("\n\n"));
    markdown(env, "article-2-0123456789abcdef", { slug: "private-draft", draft: true }, "Private draft");
    markdown(env, "article-3-0123456789abcdef", { slug: "orphan-article" }, "Unreferenced content");
    snapshot(env, {
      articles: [publicId],
      collections: [{ title: "Real path", slug: "real-path", description: "A path", audience: "Readers", stages: [], done: 0 }],
      projects: [{ name: "Real project", slug: "real-project", summary: "Project", status: "online", stack: ["Astro"], result: "Ready", link: "javascript:alert(1)" }],
      notes: [{ date: "2026-09-26", type: "Progress", title: "Real note", summary: "Synced", tags: [] }],
    });
    const result = build(env);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const html = readFileSync(join(env.output, "articles/published-markdown/index.html"), "utf8");
    for (const expected of ["Rendered Markdown", "<ul>", "<table>", "<pre", "color:#"]) assert.ok(html.includes(expected), expected);
    for (const unsafe of ["window.__unsafe=1", 'href="javascript:', "position:fixed"]) assert.ok(!html.includes(unsafe), unsafe);
    for (const slug of ["private-draft", "orphan-article", "build-personal-blog"]) assert.ok(!existsSync(join(env.output, "articles", slug)));
    assert.ok(readFileSync(join(env.output, "index.html"), "utf8").includes("/articles/published-markdown/"));
    assert.ok(readFileSync(join(env.output, "collections/real-path/index.html"), "utf8").includes("0 / 0"));
    assert.ok(readFileSync(join(env.output, "notes/index.html"), "utf8").includes("Real note"));
    assert.ok(!readFileSync(join(env.output, "projects/real-project/index.html"), "utf8").includes('href="javascript:'));
  } finally { rmSync(env.root, { recursive: true, force: true }); }
});

test("an authoritative empty snapshot never resurrects examples or withdrawn routes", () => {
  const env = fixture();
  try {
    markdown(env, publicId);
    snapshot(env);
    const result = build(env);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(!existsSync(join(env.output, "articles/published-markdown")));
    assert.ok(!existsSync(join(env.output, "articles/build-personal-blog")));
    for (const [route, text] of [["articles", "暂无已发布文章"], ["collections", "暂无专题"], ["projects", "暂无项目"], ["notes", "暂无记录"]]) {
      assert.ok(readFileSync(join(env.output, route, "index.html"), "utf8").includes(text), route);
    }
  } finally { rmSync(env.root, { recursive: true, force: true }); }
});

test("missing references and duplicate slugs fail the build", () => {
  const env = fixture();
  try {
    snapshot(env, { articles: ["article-99-0123456789abcdef"] });
    let result = build(env);
    assert.notEqual(result.status, 0);
    markdown(env, publicId);
    markdown(env, "article-2-0123456789abcdef");
    snapshot(env, { articles: [publicId, "article-2-0123456789abcdef"] });
    result = build(env);
    assert.notEqual(result.status, 0);
  } finally { rmSync(env.root, { recursive: true, force: true }); }
});

test("invalid Front Matter and snapshot draft references fail the build", () => {
  const env = fixture();
  try {
    markdown(env, publicId, { date: "2026-02-30" });
    snapshot(env, { articles: [publicId] });
    let result = build(env);
    assert.notEqual(result.status, 0);
    markdown(env, publicId, { draft: true });
    result = build(env);
    assert.notEqual(result.status, 0);
  } finally { rmSync(env.root, { recursive: true, force: true }); }
});
