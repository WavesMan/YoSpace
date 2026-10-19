# YoSpace 依赖更新后 EdgeOne Maker 502 分析报告

日期：2026-10-04（北京时间）

分析对象：`YoSpace/feature/dep-version-update`，提交 `2ca24f9af6edfa4332d69333365f73d3ac8922b4`。

对照对象：本地保存的 `origin/main`，提交 `f80c88ee5b5b6b1af82821ac9e2146c1ac5fc0c6`。本次未 fetch，因此该引用不代表远端此刻的最新状态。

## 结论

高置信度判断：这次 502 对应 **Next.js 16.3.1 的 Turbopack 文件追踪缺陷与 pnpm 依赖布局共同触发的运行产物缺文件问题**。升级 Next.js 后，间接依赖 `@swc/helpers` 从 `0.5.15` 变为 `0.5.23`；新版本通过 `module-sync` 条件让支持同步加载 ESM 的 Node.js 选择 `esm/` 文件，但本地现有构建的追踪清单只记录了 CJS 文件。若 EO 依据这些清单裁剪依赖，部署后的 SSR 云函数便会在加载 Next.js 时失败，平台对外返回 `CLOUD_FUNCTION_INVOCATION_FAILED`。

TypeScript 7 升级不是当前堆栈所指向的直接原因。上游无 TypeScript 的最小复现也出现相同错误。单独回退 TypeScript，预计不能修复这次 helper 文件遗漏；最终应通过单变量部署验证。

上游已经修复：**Next.js 16.3.2 发布说明明确包含修复回移 PR #97453**。首选建议是仅把 Next.js 从 `16.3.1` 升到 `16.3.2` 进行最小变更验证，保留 TypeScript 7 和其他升级项，再执行 EO 预览部署验收。该建议针对本次缺陷，并不等于对所有后续兼容性作保证。[16.3.2 发布说明](https://github.com/vercel/next.js/releases/tag/v16.3.2)

本次完成了仓库、现有产物和模块解析机制验证；没有下载 EO 实际部署包，也没有执行云端重部署。因此，EO 具体打包方式以及升级后的线上恢复情况仍待验收。

## 故障证据

用户提供的日志截图记录了北京时间 `2026-10-04 21:35:48` 的 SSR 失败，运行环境为 Node.js `20.19.3`，界面运行时间显示 `0ms`。

核心异常为：

```text
Error: Cannot find module
/var/user/node_modules/.pnpm/next@16.3.1_.../node_modules/@swc/helpers/esm/_interop_require_default.js

code: 'MODULE_NOT_FOUND'
path: '.../node_modules/@swc/helpers/package.json'

at .../next/dist/server/require-hook.js:68:36
at .../next/dist/server/require-hook.js:79:28
Node.js v20.19.3
```

这说明失败发生在服务器加载依赖时；它不是浏览器端资源请求、图片白名单或音乐 API 返回的 502。`require-hook.js` 是调用链上的模块解析钩子，不能仅凭堆栈位置判断该钩子本身有缺陷。实际缺失目标是 helper 的 ESM 文件。

`0ms` 和启动期模块异常支持“业务请求处理前失败”的判断；平台显示精度不足以证明真实执行时间严格为零。

## 依赖与变更对比

以下版本来自 `package.json` 和 `pnpm-lock.yaml`，以锁文件实际解析值为准。

| 项目 | origin/main | 依赖更新分支 | 与本次故障的关系 |
| --- | --- | --- | --- |
| Next.js | 16.1.4 | 16.3.1 | 核心触发版本 |
| @swc/helpers | 0.5.15 | 0.5.23 | Next.js 的间接运行依赖；条件导出发生变化 |
| TypeScript | 5.9.3 | 7.0.2 | 同时升级，但没有证据指向其为直接原因 |
| React / React DOM | 19.2.3 | 19.2.3 | 未变化 |
| 包管理器声明 | 无 packageManager 字段 | pnpm 11.22.0 | 嵌套虚拟存储布局是上游已知触发条件 |
| pnpm lockfileVersion | 9.0 | 9.0 | 不能将本次问题归因于锁文件格式变化 |
| lint | ESLint | Oxlint | 不在当前运行时异常链中 |

主要升级由提交 `ca8a9a3` 引入，其中同时升级 Next.js、TypeScript，替换 lint 工具并加入 pnpm 工作区配置；后续提交 `2ca24f9` 继续更新开发依赖。

`origin/main` 与当前分支还存在其他内容、配置和资源差异，不能把两个分支简单当作只改变 TS/Next 的严格 A/B 实验。本次额外检查了升级提交的父提交到 HEAD 的配置差异：`next.config.js`、`next.config.ts`、`tsconfig.json` 未在这段升级过程中改变，故依赖更新是更直接的解释。

`@swc/helpers` 在新锁文件中仍是 Next.js 的正式依赖，并没有被声明为可选依赖。因此“optionalDependencies 被跳过”或 `allowBuilds` 没有允许 helper，均不能解释当前缺失的纯 JavaScript ESM 文件。

## 故障机制

本地安装的 `@swc/helpers@0.5.23` 对该子路径的导出为：

```json
{
  "module-sync": "./esm/_interop_require_default.js",
  "webpack": "./esm/_interop_require_default.js",
  "import": "./esm/_interop_require_default.js",
  "default": "./cjs/_interop_require_default.cjs"
}
```

1. Next.js 16.3.1 引入 helper 0.5.23。
2. pnpm 虚拟存储提供多个依赖解析候选目录。
3. Turbopack 的解析结果合并丢失条件信息，导致文件追踪遗漏 ESM 分支。
4. 按追踪清单组装的运行包可能只有 `package.json`、CJS 文件和链接。
5. EO 的 Node.js 20.19.3 支持 `module-sync`，运行时选择 ESM 分支。
6. ESM 文件在裁剪后的运行包中不存在，Next.js 无法加载，SSR 云函数失败并返回 502。

第 3 步是上游维护者在修复 PR 中说明的缺陷：替换请求键时条件被覆盖，多个目录的解析结果合并后丢失其中一个导出目标。它比笼统描述为“Next 不兼容 EO”更准确。[上游修复 PR #97372](https://github.com/vercel/next.js/pull/97372)

部分上游报告只写了 Node 22/24，但 Node.js 官方发布说明明确：**20.19.0 也已默认启用 require(esm)，并实现 module-sync 导出条件**。因此 EO 使用 Node 20.19.3 并不排除该机制。[Node.js 20.19.0 发布说明](https://nodejs.org/en/blog/release/v20.19.0)

Next.js 官方说明，构建会生成 `.nft.json` 记录服务器所需文件，部署工具可据此复制文件；启用 standalone 时也依赖这一机制。当前仓库没有显式配置 `output: 'standalone'`，本地现有产物也没有 standalone 目录，所以不能声称本仓库直接生成了 standalone 包。**EO 是否读取这些清单、是否强制 standalone 或使用其他裁剪策略，需要其构建日志或部署包确认。** 当前线上错误与缺陷特征高度吻合。[Next.js 文件追踪说明](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

完整本地 node_modules 保留了 ESM 文件，因此正常本地运行或构建通过，都不能证明裁剪后的云端运行包完整。

## 本地验证结果

验证环境：Windows，Node.js `24.11.1`，pnpm `11.22.0`，已安装 Next.js `16.3.1` 和 helper `0.5.23`。

本次读取现有 `.next` 构建，没有重新执行完整构建；`BUILD_ID` 文件最后写入时间为北京时间 `2026-10-03 23:26:40`。这些产物可以支持机制分析，但不应当作本次重新构建或 EO 部署产物的证据。

### 追踪清单检查

扫描现有构建共 29 个 `.nft.json`：

| 检查 | 结果 |
| --- | --- |
| 含 @swc/helpers ESM 文件的追踪清单 | 0 |
| 含 @swc/helpers CJS 文件的追踪清单 | 28 |
| next-server.js.nft.json 中 helper 相关条目 | 5 条，包括 2 个 CJS 文件、package.json、2 个链接路径 |

其中服务器追踪清单包含：

```text
@swc/helpers/cjs/_interop_require_default.cjs
@swc/helpers/cjs/_interop_require_wildcard.cjs
@swc/helpers/package.json
```

没有包含截图中报错的 `esm/_interop_require_default.js`。

### 隔离模块加载实验

在系统临时目录创建独立 helper 包，保证 Node.js 不会回退到仓库完整 node_modules。仅复制安装包的 `package.json` 和 `cjs/`，执行同一个 `require('@swc/helpers/_/_interop_require_default')`，然后做两个对照。

| 独立目录内容与条件 | 退出码 | 结果 |
| --- | --- | --- |
| 只有 package.json 与 cjs，默认 Node 条件 | 1 | MODULE_NOT_FOUND，缺少 esm/_interop_require_default.js |
| 相同目录，加入 --no-experimental-require-module | 0 | 解析为 cjs/_interop_require_default.cjs 并加载成功 |
| 补齐 esm，恢复默认 Node 条件 | 0 | 解析为 esm/_interop_require_default.js 并加载成功 |

该实验确认“追踪文件与运行时导出条件不一致”足以产生相同异常，也确认补齐 ESM 可修复模块加载。它不等价于 EO 完整应用部署测试；本机没有执行 Node 20.19.3 下的相同实验。

上游 issue #97358 提供无 TypeScript 的 pnpm 最小复现，相同报错发生于 standalone 启动阶段；其记录与本地现象一致。[上游问题 #97358](https://github.com/vercel/next.js/issues/97358)

## 修复建议与验收

### 首选：升级到包含上游修复的版本

先进行最小版本变更验证：

```powershell
pnpm add next@16.3.2 --save-exact
pnpm install --frozen-lockfile
pnpm build
```

提交 package.json 和新生成的 pnpm-lock.yaml，清除 EO 构建缓存后重新构建预览环境。TypeScript 先保留 7.0.2，减少变量。

依据：修复 PR #97372 已回移到 16.3 分支的 PR #97453，且 16.3.2 发布说明明确列出该回移。修复发布于 2026-08-21；当前分支仍固定为 16.3.1，因此不会自动获得它。[回移 PR #97453](https://github.com/vercel/next.js/pull/97453)，[16.3.2 发布说明](https://github.com/vercel/next.js/releases/tag/v16.3.2)

验收标准：

1. 新构建的服务器追踪清单包含 helper 所需 ESM 文件。
2. 最终运行包中的 helper 链接有效，`esm/_interop_require_default.js` 实际存在；不能只检查清单。
3. 在脱离源码 node_modules 的运行包中，使用 EO 对应 Node 20.19.3 验证模块加载与应用启动。
4. EO 预览环境的首页、博客详情和服务器 API 请求成功，冷启动后不再出现 MODULE_NOT_FOUND。

若本地新产物正常但 EO 仍缺文件，则继续检查 EO 构建是否实际使用新锁文件、缓存是否复用旧产物，以及平台适配器是否忽略或重新裁剪追踪结果。

### 备用：保留 16.3.1 时强制包含 helper

若暂时不能升级，可在实际生效的 Next 配置中尝试：

```js
outputFileTracingIncludes: {
  '/*': [
    './node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*',
  ],
},
```

这是针对当前 pnpm 虚拟存储布局的临时方案，使用正斜杠以跨平台匹配。构建后必须检查最终 EO 包是否确实包含 ESM；平台若不消费这项配置，仍需在平台打包阶段补齐文件。Next.js 官方支持用该配置补充追踪遗漏。[配置说明](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

仓库同时存在 `next.config.js` 与 `next.config.ts`。本地 Next.js 的配置候选顺序是 JS、MJS、TS，现有产物未启用 TS 文件中的 reactCompiler，符合 JS 配置优先加载。不要只修改 TS 文件后就认定配置已生效；EO 适配器是否改变加载行为还需核对。

### 其他可选验证

- 紧急恢复可重新部署用户已确认正常的 main 版本；单独回退 Next.js 到旧版本用于 A/B 定位时，需要重新生成锁文件。历史版本回退是应急措施，不作为长期升级方案。
- `next build --webpack` 可以用于排除 Turbopack 路径，但本次没有验证该项目的 Webpack 构建及 EO 部署结果。
- 禁用 require(esm) 在隔离实验中有效，但需要平台允许给运行时设置 Node 参数，且会改变全局模块语义；不列为首选生产方案。
- 仅升级 Node 到 22/24不会消除“ESM 文件缺失”，因为这些版本同样支持 module-sync。

## 分析范围

本次只新增分析报告，没有修改应用依赖或部署配置，没有提交、推送或部署。已确认模块解析机制与现有追踪遗漏，已核实上游正式修复版本；EO 实际打包链路和修复部署结果尚未直接验证。
