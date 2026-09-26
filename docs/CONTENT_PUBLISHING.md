# 公开内容同步

## 数据流

后台写入 API 后，SQLite 是编辑数据的来源。API 在同一写入流程中把已发布文章导出到 `apps/site/src/content/published/articles/`，并将文章文件引用、专题、项目和记录写入 `snapshot.json`。文章 Front Matter 包含标题、slug、日期、分类、阅读时间等，正文由 Astro Content Collections 渲染。文件名 `article-<数据库 ID>-<16 位摘要>.md` 的摘要基于加入 `id` 字段之前的 Markdown 内容，用来稳定标识内容版本，并非最终文件字节的哈希。

站点构建只接受快照引用的文章，不会将目录里的孤立文件或草稿发布出去。撤回、删除及 slug 修改会更新快照并清理过时的受管理文件；空快照表示公开内容为空，不会回退到演示数据。仅当快照不存在时，站点才显示 `src/content/examples/` 中的演示文章及配套演示数据。专题、项目和记录也从快照读取，不调用运行中的 API。无效或缺失引用会让构建失败。

本地生成的 `published/`、SQLite 数据库及构建产物均被 Git 忽略，不应提交用户文章。发布成功只表示本地同步完成；没有自动 Git 提交、推送或部署，公开站点必须在同步后重新构建并部署。生产环境需要将 SQLite 和生成目录持久化，并让 API 与构建进程访问同一份内容目录，或由部署流程传递完整快照与 Markdown 文件。

## 本地操作

从仓库根目录安装依赖后，启动 API 和前端：

```bash
npm install
npm run dev:api
npm run dev:admin
npm run dev:site
```

默认数据库为 `services/api/.data/articles.db`，默认生成目录为 `apps/site/src/content/published/`。可在启动 API 前设置 `MYSELF_DATABASE_PATH` 和 `MYSELF_CONTENT_DIR`；站点命令在 `apps/site` 工作目录运行时也须使用相同的绝对 `MYSELF_CONTENT_DIR`。手动重建快照与 Markdown：

```bash
npm run sync:content
npm run build:site
```

API 启动时也会根据 SQLite 重同步。若文件写入或数据库提交失败，请检查 API 日志并重试；写入失败会回滚本次数据库修改。异常中断可能留下尚未清理的旧 Markdown，但它们不会被快照引用；重新启动 API 或运行上面的同步命令再构建。不要只复制 `snapshot.json` 而遗漏它引用的文章文件。建议在构建前运行 `npm run test:api`、`npm run test:site-content` 和 `npm run check`。

## 当前边界

后台专题、项目和记录尚无完整编辑表单；API 已提供 CRUD。后台的 Mock 回退仅供演示，不能当作真实发布成功。API 未接入身份认证，不能公开部署。下一阶段是补齐三类内容的后台编辑，再实现受控的 Git 发布与 CI 部署。
