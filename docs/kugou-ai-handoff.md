# 给 AI 的酷狗接入任务

把下一节完整复制给负责后端的 AI 即可。先让它检查实际源码和运行环境，再部署；不要把真实 token 填进此文档或提交到 GitHub。

## 可以直接复制的需求

我有一个静态博客，源码在 `D:\Allcode\Blog`，线上是 `https://dr-blog.top`，托管在 GitHub Pages。首页已有酷狗最近播放组件，现在要实现它的后端。

请协助我部署社区项目 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi)，并在它外面提供一个只读的歌曲展示接口。参考[项目接口文档](https://github.com/MakcRe/KuGouMusicApi/blob/main/docs/README.md)。

请按下面顺序完成：

1. 先问我使用酷狗标准版还是概念版、有没有服务器或 Serverless 平台。查当前项目 README、package.json，确认 Node 版本、启动方式及平台配置。不同平台的 token 不通用。
2. 帮我在后端完成账号授权。优先按项目支持的扫码流程获取登录态，也可使用我已有的登录态。真实 `token`、`userid` 只放在服务端环境变量或私有配置，不要提交到仓库，不要打印完整凭据。
3. 登录后调用社区服务的 `/user/history`。这不是官网公开路径，不能直接请求 `https://www.kugou.com/user/history`。上游实现是 `module/user_history.js`，读取 `token`、`userid`，支持 `bp` 分页。
4. 根据真实返回的数据结构，提取最近 5 首歌曲的名称、歌手、可用封面及分享链接。保留上游顺序，不要猜字段，不要用演示歌曲代替实际数据。
5. 提供一个公开只读接口，例如 `GET /api/music/recent`。博客访客无需登录，也不传 token。接口返回下面的 JSON 格式：

```json
{
  "songs": [
    {
      "title": "真实歌曲名",
      "artist": "真实歌手名",
      "cover": "https://有效的封面地址",
      "url": "https://有效的歌曲分享地址"
    }
  ]
}
```

`songs` 是数组，`title` 必填；其余字段可省略。没有历史记录时返回 `{"songs":[]}`；上游登录过期或请求失败应返回非 2xx，不要返回伪造的成功结果。不要把原始用户数据、cookie、token 返回给前端。

6. 公开接口使用 HTTPS；允许 `https://dr-blog.top` 的 CORS GET 请求。建议服务端缓存约 5 分钟，并设置上游请求超时。GitHub Pages 自身不能执行这段 Node 后端，需要独立部署。
7. 验证公开接口能获取真实数据后，修改博客的 `assets/js/music-config.js`：

```js
window.musicConfig = Object.freeze({
    recentEndpoint: '这里填已部署的公开 HTTPS 接口地址',
    limit: 5
});
```

这是填写格式，必须换成真实地址。该文件目前地址为空，不能填 KuGouMusicApi 的带 token 请求 URL。前端 `assets/js/music.js` 已实现请求、歌曲展示、空状态和失败状态，默认 8 秒超时，使用 `credentials: 'omit'`。

8. 在手机和桌面上验证歌曲展示。按实际环境写清部署、配置登录态、token 过期后重新授权、启动与更新的方法，再提交博客的公开配置。不要把后端密钥或 .env 文件提交到 Blog。

## 我最后需要得到什么

- 一个真正可访问的 HTTPS 最近播放地址。
- 一份说明：后端在哪部署，服务怎么启动，凭据在哪配置，过期后怎么更新。
- 博客 music-config.js 已填好公开地址。
- 浏览器里能看到真实最近播放，前端源码和接口响应中没有 token。

## 以后展示“我喜欢”

先用 `/user/playlist` 查询账号歌单，确定“我喜欢”的 `listid`，再用 `/playlist/track/all/new?listid=对应ID` 读取。请检查实际返回值，不要假定固定歌单 ID。这部分暂不需要接入首页。
