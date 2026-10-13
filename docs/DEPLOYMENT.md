# 服务器部署

## 当前环境

- 公网入口：<http://47.109.193.62/>
- 系统：Ubuntu 24.04 系列
- 编排：Docker Compose，服务包括 FastAPI、自动构建器、React 管理后台和 Nginx 网关
- 项目目录：`/opt/myself`
- 生产环境文件：`/opt/myself/.env.production`（只保存在服务器，不提交 Git）
- Docker named volumes：数据库、公开内容、站点产物和后台产物

当前服务器通过 Nginx 同源提供博客、后台和 API：博客为 `http://47.109.193.62/`，后台为 `http://47.109.193.62/admin/`，API 健康检查为 `http://47.109.193.62/api/health`。Nginx 会保留 `/api/...` 前缀转发给 FastAPI，登录和内容接口因此与前端 API 客户端保持一致。当前使用 IP + HTTP，未配置 TLS；正式上线前应绑定域名、配置 HTTPS，并相应调整 `apps/site/astro.config.mjs` 中的 `site`。

## 发布和回滚

Docker 配置修改后使用 `docker compose config` 校验，再重新构建并启动服务。宿主机旧 Nginx 已停止并禁用，入口由 Compose 中的 `web` 容器提供。

服务器上的 Docker 数据卷和 `.env.production` 不得删除；更新镜像不会删除这些卷。

## 后续自动化

当前 `/opt/myself` 是上传的源码副本，不包含 `.git`，不能直接执行 `git pull`。更新时从 GitHub 获取目标版本源码，保留服务器 `.env.production` 和数据卷，再执行 `docker compose up -d --build`；文章发布则通过后台调用 API，写入 SQLite 后由 `site-builder` 自动重建公开站点。后续可在 CI/CD 中复用“获取源码、构建镜像、健康检查、失败回滚”流程；部署凭据应改用受限 SSH key 或 CI secret，不使用共享账户密码。

## 2026-10-13 访问故障恢复

公网博客、后台和 API 无响应，服务器 80/443 端口没有监听。日志显示 2026-09-28 23:54 Docker socket 配置发生变化后失去监听描述符；Docker 随后报 `no sockets found via socket activation`，于 2026-09-29 00:00 进入启动失败状态。磁盘空间充足，数据库和内容卷目录仍存在。

恢复现有服务，无需删除容器或数据卷：

```bash
sudo systemctl daemon-reload
sudo systemctl reset-failed docker.service docker.socket
sudo systemctl restart docker.socket
sudo systemctl start docker.service
sudo systemctl is-active docker.socket docker.service
sudo systemctl is-enabled docker.socket docker.service
cd /opt/myself
docker compose ps -a
```

现有 `api`、`site-builder`、`web` 容器使用 `unless-stopped`，本次 Docker 恢复后自动启动；`admin-builder` 构建成功后退出（exit 0）属于正常状态。若现有三个运行服务仍停止，可执行 `docker compose start api site-builder web`，不要执行 `docker compose down -v`。

恢复后另修正旧网关的 API 路径：`/api/` 代理保留前缀，匹配 FastAPI 的登录及内容路由；`/api/health` 精确映射为后端 `/health`，避免修复登录后破坏健康检查。只重新构建、替换 `web`，不重建数据库或内容服务：

```bash
docker compose build web
docker compose up -d --no-deps web
docker compose exec -T web nginx -t
curl -fsS http://127.0.0.1/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/api/articles
```

最后一项未携带会话，应返回 **401**，而非 404；通过服务器环境变量验证管理员登录时，只输出验证结果，不输出密码、认证密钥或令牌。生产访问仍使用 HTTP，域名和 HTTPS 配置尚未完成。

静态资源检查另发现后台白屏问题：旧构建引用根目录 `/assets/...`，但后台文件由 Nginx 在 `/admin/` 下提供。将 `apps/admin/vite.config.ts` 的 `base` 设为 `/admin/`，入口 favicon 使用 `%BASE_URL%`，然后仅重新构建后台产物：

```bash
docker compose build admin-builder
docker compose run --rm --no-deps admin-builder
```

本次恢复保留的回溯材料：

- 旧网关配置：`/opt/myself/deploy/nginx.conf.pre-recovery-20261013`。
- 旧网关、后台构建器镜像：`myself-web:pre-recovery-20261013`、`myself-admin-builder:pre-recovery-20261013`。
- 后台原配置、入口及静态产物归档：`/opt/myself/backups/recovery-20261013/`。

验收结果：

- 公网首页、文章列表、已有文章详情、后台入口及健康检查均返回 200；后台脚本、样式、favicon 和博客引用的样式均返回 200。
- 管理员登录及携带会话的文章、专题、项目、记录和概览接口均返回 200；未携带会话的内容接口返回 401，空登录请求返回 422。
- 使用内置浏览器在 1280 × 720 桌面视口验证后台：URL 和标题正确，登录页完整显示，无白屏或框架错误覆盖层；点击空表单的“进入工作台”后显示“请输入邮箱和密码。”；修复后加载的控制台无 error/warn。
- 本地及服务器后台构建均通过；Nginx 配置检查通过；Docker service/socket 均为 active、enabled。
- SQLite 以只读模式执行 `PRAGMA quick_check`，结果为 `ok`。本次未新建或修改生产文章，未执行浏览器内真实账号登录或发布测试，未覆盖移动端。
