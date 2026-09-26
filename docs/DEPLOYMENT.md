# 服务器部署

## 当前环境

- 公网入口：<http://47.109.193.62/>
- 系统：Ubuntu 24.04 系列，Nginx 提供静态文件
- 站点目录：`/var/www/myself/current`
- 发布目录：`/var/www/myself/releases/<UTC 时间戳>`
- Nginx 站点配置：`/etc/nginx/sites-available/myself`
- 首次部署前的默认站点配置备份：`/etc/nginx/sites-available/default.myself-backup-<UTC 时间戳>`

部署仅包含 `apps/site/dist` 的静态产物。API 和管理后台没有部署；API 当前缺少身份认证，不应暴露到公网。服务器返回首页、文章详情和 favicon 均为 HTTP 200。当前使用 IP + HTTP，未配置 TLS；上线正式域名前应绑定域名、配置 HTTPS，并相应调整 `apps/site/astro.config.mjs` 中的 `site`。

## 发布和回滚

构建通过后，将完整 `apps/site/dist` 上传到一个新的 release 目录，验证目录内容，再原子替换 `current` 软链接。Nginx 只服务 `current`，因此切换 release 不需要复制覆盖正在服务的文件。部署配置修改前先备份当前配置；运行 `nginx -t` 成功后才 reload。

回滚时将 `/var/www/myself/current` 软链接指向上一个 `/var/www/myself/releases/<时间戳>`，然后再次执行 `nginx -t` 和 `systemctl reload nginx`。保留旧 release 和配置备份，确认新版本稳定后再考虑清理。当前首次部署的默认 Nginx 配置备份位于 `/etc/nginx/sites-available/default.myself-backup-20260926133713`。

## 后续自动化

当前部署由本地构建后手动传输，不会自动推送新内容。后续可在 CI/CD 中复用“构建、上传新 release、原子切换软链接、健康检查、失败回滚”流程；部署凭据应改用受限 SSH key 或 CI secret，不使用共享账户密码。当前服务器仅需 Nginx，不需要在公网运行 Node.js、Python API 或后台开发服务器。
