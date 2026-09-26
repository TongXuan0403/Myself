# Docker 一键发布

## 服务

`docker-compose.yml` 编排四个服务：

- `api`：FastAPI、SQLite 和 Markdown/快照同步，数据写入持久化卷。
- `site-builder`：监听公开内容目录变化，自动重新构建 Astro 静态站点。
- `admin-builder`：构建 React 管理后台静态文件。
- `web`：Nginx 提供博客和后台，并把 `/api/` 代理给 API。

SQLite、公开内容、站点构建产物和后台构建产物都使用 Docker named volume，不依赖容器临时文件。API 的修改接口和读取接口都需要 Bearer 会话；只有健康检查和登录接口公开。

## 服务器首次配置

```bash
git clone https://github.com/TongXuan0403/Myself.git
cd Myself
cp .env.production.example .env.production
vi .env.production
docker compose up -d --build
```

`.env.production` 至少要设置管理员邮箱、长密码和随机认证密钥。真实 `.env.production` 已被 Git 忽略，不能提交。生产环境不要使用代码中的开发默认值，也不要在聊天、日志或仓库中记录管理员密码。

## 日常发布

打开 `http://服务器地址/admin/`，使用 `.env.production` 中的邮箱和密码登录。保存草稿或发布文章后，API 会同步 Markdown 和快照；`site-builder` 最多约 10 秒检测到文件变化并重建站点。发布失败时，前一份构建产物仍保持可用，查看日志：

```bash
docker compose logs -f api site-builder web
```

更新代码或部署新版本：

```bash
git pull
docker compose up -d --build
```

数据库和内容卷不会因重新构建镜像而删除。正式使用前应备份 Docker volumes，并为服务器绑定域名、配置 HTTPS，限制 SSH 和 Docker 管理权限。
