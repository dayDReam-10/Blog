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

这个模式用于“在你的电脑上自己看”。访问 `https://dr-blog.top` 的访客或你手机上的浏览器无法访问电脑的 `127.0.0.1`。在电脑上打开线上域名也不会显示本机歌曲；请打开 `http://127.0.0.1:4173/`。若要让公网域名显示，需要另行部署受保护的后端，不应开放电脑端口或把 token 放到前端。

## 数据来源

本地服务调用社区项目 [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) 的二维码登录和 `/user/history` 接口，缓存最近播放 1 分钟。该项目不是酷狗官方 API；使用时请遵守当地法规和上游项目免责声明。
