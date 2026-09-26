import { defineConfig } from "astro/config";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { unified } from "@astrojs/markdown-remark";

export default defineConfig({
  output: "static",
  site: "https://tongxuan0403.github.io",
  markdown: {
    processor: unified({ rehypePlugins: [[rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        pre: [...(defaultSchema.attributes?.pre ?? []), ["className", "astro-code"], ["style", /^background-color:#[0-9a-fA-F]{3,8};color:#[0-9a-fA-F]{3,8};?$/], "tabIndex"],
        span: [...(defaultSchema.attributes?.span ?? []), ["style", /^color:#[0-9a-fA-F]{3,8}(?:;font-style:italic|;font-weight:bold|;text-decoration:underline)*;?$/]],
        code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/]],
      },
    }]] }),
  },
  trailingSlash: "always"
});
