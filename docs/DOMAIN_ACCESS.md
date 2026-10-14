# 域名访问诊断与恢复

## 2026-10-14 联系人更换后的复查

最新域名详情截图显示联系人已改为个人邮箱，实名认证及邮箱验证均通过。北京时间约 09:10 复查结果：

| 检查项 | 最新结果 | 下一步 |
| --- | --- | --- |
| `whois.nic.me` | 域名状态为 `ok`，已无 `clientHold` | 联系人更换及注册商解锁已生效 |
| `a0.nic.me`、`b0.nic.me` | 查询 `tongxuan.me NS` 仍为 NXDOMAIN | 等待注册局 DNS 恢复委派；暂不能认定公网解析已恢复 |
| 公共 DNS `223.5.5.5`、`119.29.29.29` | 域名查询仍为 NXDOMAIN | 注册局恢复后再复查，公共 DNS 可能保留负缓存 |
| 阿里云权威 DNS 两台服务器 | `tongxuan.me` 未返回 A 记录；`www` 在已查询权威服务器上仍为 `47.109.193.62` | 如需访问不带 www 的域名，添加主机记录 `@`、类型 A、值 `47.109.193.62` |
| 公网 IP 首页 | 200 | 网站进程正常 |
| 服务器内部携带两个域名 Host | 均为 200 | Nginx 能处理两个域名 |
| 公网强制域名连接测试 | `tongxuan.me` 一次为 403、复测为 200；`www` 多次为 403 | `www` 的 403 响应来自 `Server: Beaver`，页面标题为 `Non-compliance ICP Filing`，指向阿里云备案拦截页；需在阿里云完成或核对备案接入 |
| HTTPS | 无 443 监听，强制连接失败 | DNS 恢复、备案入口正常后配置可信证书和 HTTPS |

当前联系人问题已解决。直接访问 `tongxuan.me` 仍需补齐 `@` A 记录并等待注册局委派恢复；`www` 还存在有实测页面证据的阿里云备案拦截。域名实名认证不等于网站 ICP 备案。备案问题应按阿里云控制台实际原因处理；不能通过重装网站或修改 Nginx 解除云平台拦截。

本次只进行了只读检查并更新诊断文档，未改生产配置或用户的 DNS 记录；此前章节为历史诊断及处理步骤。

## 2026-10-13 诊断结论

目标入口为 `www.tongxuan.me`，服务器为 `47.109.193.62`。阿里云权威 DNS 已正确保存 `www` 的 A 记录，但 WHOIS 显示域名处于 **clientHold**：注册商暂停了域名解析，`.me` 注册局权威 DNS 未对公网提供该域名的委派。因此公共 DNS 返回 NXDOMAIN，访问请求尚未到达网站服务器。

| 检查项 | 实测结果 | 含义 |
| --- | --- | --- |
| WHOIS（`whois.nic.me`） | 注册商为 Alibaba Cloud / HiChina，状态为 `clientHold`，到期时间为 2027-09-03 | 注册商锁定；本次检查时未过期 |
| `.me` 权威 DNS（`a0.nic.me`、`b0.nic.me`） | `tongxuan.me NS` 均为 NXDOMAIN，带权威回答标志 `aa` | 注册局层面未提供公网委派，问题不限于本机缓存 |
| 阿里云权威 DNS（`dns21.hichina.com`、`dns22.hichina.com`） | `www.tongxuan.me A` 均为 NOERROR，`47.109.193.62`，TTL 600 | `www` A 记录配置正确 |
| 裸域 `tongxuan.me` | 阿里云权威 DNS 未返回 A 记录 | 如需裸域访问，另加 `@` A 记录；这不是 `www` 访问失败的原因 |
| 公网 IP 的 HTTP 首页 | 200 | 网站入口正常 |
| 强制 `www.tongxuan.me` 指向 IP 的 HTTP 请求 | 首页、`/admin/`、`/api/health` 均为 200，健康检查正常 | Nginx 能接收该域名的 Host，网站和 API 正常 |
| HTTPS | 服务器无 443 监听，未配置 TLS | 域名解锁后还需配置 HTTPS |

本次未修改生产 Nginx、DNS 记录、数据库或文章。服务器现有 HTTP 配置能够接收 `www.tongxuan.me`，无需通过重装 Docker或重复修改正确的 A 记录来处理注册商锁定。

## 解除 clientHold

1. 登录 [阿里云域名控制台](https://dc.console.aliyun.com/#/domain-list/all)，找到 `tongxuan.me`，单击 **管理**，查看 **基本信息** 中的异常提示、联系人邮箱验证状态和实名认证状态。
2. 按具体提示处理：邮箱未验证时完成邮箱验证；实名信息未完成或不完整时按控制台指引补全；如提示其他锁定原因或已完成验证仍被锁定，联系阿里云售后确认并解除。根据 2026-10-14 提供的域名详情截图，具体原因已确认：联系人邮箱使用阿里云公共模板邮箱 `zyhl-admin@list.alibaba-inc.com`，且状态显示“验证未通过”，因此注册商保持 `clientHold`，公网解析仍会被暂停。
3. 重新查询 WHOIS，确认 `clientHold` 已移除，再检查公网 DNS。解锁和解析恢复可能有延迟，具体时间以控制台及阿里云反馈为准；DNS 缓存刷新不能替代注册商解锁。

### 截图对应的处理路径

由于当前联系人邮箱是阿里云公共邮箱模板，不能通过该公共邮箱完成验证。进入域名详情的 **管理 → 基本信息 → 联系人邮箱右侧“更改（过户）”**，选择一个你本人可收信、且已完成实名认证和邮箱验证的信息模板，按页面完成验证码和提交。阿里云官方文档将这一操作称为“快速过户”；如果没有合格模板，先创建并完成实名认证、邮箱验证的信息模板，再回到域名管理执行过户。提交后等待注册商状态同步，再复查 WHOIS 和公网 DNS。

2026-10-14 截图显示：新邮箱已经添加，当前状态为“验证中”；另一个邮箱为“验证通过”。这说明邮箱验证流程尚未完成，不能把“验证中”的邮箱直接当作已合格的域名联系人模板。请先在新邮箱中打开阿里云验证邮件中的链接；如果没有收到邮件，在邮箱列表中点击“重发验证邮件”。状态变为“验证通过”后，再回到域名详情执行上述“更改（过户）”，并选择已完成实名认证和邮箱验证的模板。

官方依据：[解除域名锁定状态 Clienthold、Serverhold](https://help.aliyun.com/zh/dws/support/how-to-unlock-a-domain-name-that-is-in-the-serverhold-or-clienthold-state)。域名实名认证与网站备案是不同事项，当前 DNS 故障已由 `clientHold` 证据定位，不能据此断定网站备案状态。

如需要进一步协助，可提供域名详情页的异常提示截图，遮盖联系人信息及其他敏感字段。不要把账户密码、验证码或身份证材料写入本仓库。

## DNS 恢复后的验收

`www` 的现有记录保持为：

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| `www` | A | `47.109.193.62` |
| `@`（需要裸域访问时添加） | A | `47.109.193.62` |

Windows 上检查公共解析和 HTTP：

```powershell
Resolve-DnsName www.tongxuan.me -Type A -Server 223.5.5.5
curl.exe --noproxy "*" --max-time 15 -I http://www.tongxuan.me/
curl.exe --noproxy "*" --max-time 15 -I http://www.tongxuan.me/admin/
curl.exe --noproxy "*" --max-time 15 http://www.tongxuan.me/api/health
```

预期 A 记录为 `47.109.193.62`，首页、后台和健康检查均返回 200。对照检查可临时绕过 DNS，强制指定目标 IP；它只验证服务器能否响应域名，不代表公网解析已经恢复：

```powershell
curl.exe --noproxy "*" --max-time 15 --resolve www.tongxuan.me:80:47.109.193.62 -I http://www.tongxuan.me/
```

当前临时博客入口为 <http://47.109.193.62/>。

## HTTPS 后续工作

公网 DNS 恢复并通过 HTTP 验收后，为正式域名申请可信 TLS 证书，配置 Compose 网关的 443 端口、证书挂载和自动续期，并验证安全组放行。HTTPS 可用后再设置 HTTP 跳转 HTTPS，并将 `apps/site/astro.config.mjs` 的 `site` 更新为确定的正式 HTTPS 域名，重新构建以同步 canonical、RSS 等链接。

以上 HTTPS 工作尚未执行；2026-10-14 注册商锁定已解除，但注册局委派及公网 DNS 尚未恢复，且 `www` 存在备案拦截，基于公网访问的证书验证目前仍受阻。
