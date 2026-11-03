# 在本机查看酷狗最近播放

酷狗登录和取数只在本机运行。网页通过 `127.0.0.1` 连接本地服务；服务不监听局域网地址，不把 token 上传到 GitHub，也不会把最近播放同步到 `https://dr-blog.top`。线上静态站点不会读取你电脑的数据。

## 首次启动

要求 Windows、Node.js 18+ 和可访问 GitHub/npm 的网络。

1. 酷狗标准版双击 `scripts/start-local-blog.bat`；酷狗概念版双击 `scripts/start-local-blog-lite.bat`。两个版本的 token 不通用。
2. 首次启动时，脚本会把社区项目下载到被 Git 忽略的 `.local/KuGouMusicApi` 并安装依赖。
3. 浏览器打开 `http://127.0.0.1:4173/` 后，点“连接酷狗”。
4. 使用酷狗 App 扫码并确认。成功后首页会显示最近播放的歌曲。

以后仍用同一个 bat 启动。要停止服务，关闭最小化的 `DayDReam local server` 命令窗口。

## 登录信息与隐私

授权信息保存在 `.local/kugou-auth.json`，仅供本机服务读取；`.local/` 和 `node_modules/` 已加入 `.gitignore`。页面只收到歌曲标题、歌手、封面和歌曲链接。上游 API 代码也只保存在 `.local`，不会加入博客仓库。

如果酷狗授权过期，重新点“连接酷狗”扫码。要移除本机授权，可关闭服务后删除 `.local/kugou-auth.json`；若要清除本地下载的 API 和依赖，可删除整个 `.local` 文件夹。

## 线上和本地的区别

本机访问 `http://127.0.0.1:4173/` 时优先读取实时接口。线上 `https://dr-blog.top` 读取 `assets/data/recent-songs.json`，该文件由 GitHub Actions 定时生成；访客只能看到歌曲展示字段，不会看到登录入口或 token。

## 无服务器的线上同步

仓库包含 `.github/workflows/sync-kugou.yml`，可手动运行，也会在每小时第 17、47 分钟尝试同步。GitHub 的定时任务可能延迟，因此它不是实时播放状态。

首次配置需要在 GitHub 仓库的 `Settings → Secrets and variables → Actions` 新建仓库 Secret：

- 名称：`KUGOU_AUTH_JSON`
- 内容：本机 `.local/kugou-auth.json` 的完整 JSON

不要把该 JSON 写进源码、Issue、聊天记录或普通仓库变量。配置完成后，在仓库 `Actions → Sync KuGou recent songs → Run workflow` 手动运行一次。授权过期时，本机重新扫码，再更新同名 Secret。

## 数据来源

本地服务调用社区项目 [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) 的二维码登录和 `/user/history` 接口，缓存最近播放 1 分钟。该项目不是酷狗官方 API；使用时请遵守当地法规和上游项目免责声明。
