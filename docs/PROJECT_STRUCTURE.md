# 项目骨架说明

## 1. 目标

本文档记录当前前后端项目骨架的职责划分，方便后续继续接业务时不再把逻辑堆进单文件。

## 2. 站点骨架

`apps/site`

- `src/layouts/`：统一页面外壳
- `src/components/`：首页区块和站点公共组件
- `src/data/`：首页文案和展示数据
- `src/pages/`：页面入口

## 3. 后台骨架

`apps/admin`

- `src/App.tsx`：后台页面组合入口
- `src/components/`：侧边栏、顶部栏、列表、编辑器和提示
- `src/data/`：本地演示数据
- `src/hooks/`：文章工作区状态管理
- `src/types/`：文章类型定义

## 4. API 骨架

`services/api/app`

- `core/`：应用级配置
- `routers/`：健康检查、仪表盘和文章路由
- `models.py`：请求和响应模型
- `store.py`：SQLite 仓储和业务操作
- `main.py`：应用组装入口

## 5. 启动入口

```bash
npm run dev:site
npm run dev:admin
npm run dev:api
```

## 6. 后续约定

- 页面逻辑优先放组件和 hooks。
- 路由层只做请求接入和错误映射。
- 数据库读写只放仓储层。
- 新增设计或方案类文档继续放进 `docs/`。
