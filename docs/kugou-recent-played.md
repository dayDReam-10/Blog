# 接入酷狗最近播放

首页已用 RECENTLY PLAYED 替换日历。`assets/js/music-config.js` 中的 `recentEndpoint` 按要求留空，当前显示“最近播放还在准备中”，不会请求酷狗账号数据。

## 后端取数

参考社区项目 [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) 和[接口文档](https://github.com/MakcRe/KuGouMusicApi/blob/main/docs/README.md)。这些是社区封装路由，不能直接拼到官网域名使用。

在你自己的后端部署 API 后，配置与所选平台一致的登录态，调用 `/user/history`。源实现使用 `userid` 和 `token`，可从参数或 cookie 对象读取；支持上次响应中的 `bp` 分页。标准版与概念版的 token 不通用。

后端保持上游返回的最近播放顺序，提取歌曲标题、歌手和封面。仅把以下公开展示字段返回给博客；不要返回 token、cookie、完整的上游响应或用户身份字段。

## 博客需要的响应

提供一个无需访问者登录的只读 HTTPS 地址，返回 JSON：

```json
{
  "songs": [
    {
      "title": "歌曲名",
      "artist": "歌手名",
      "cover": "https://你的封面地址/cover.jpg",
      "url": "https://你的歌曲分享地址"
    }
  ]
}
```

这是格式示例，界面不会内置这些示例歌曲。`songs` 必须是数组，`title` 必填；`artist`、`cover`、`url` 可省略。没有播放记录时返回 `{"songs":[]}`，上游请求失败或登录过期时返回非 2xx 状态，不要用空记录伪装成功。

`url` 是打开歌曲分享页的链接，此模块不自动播放或下载音频。封面为空或加载失败会显示音符。

跨域部署时，需要让后端允许博客域名 `https://dr-blog.top` 的 CORS 请求。前端使用 `credentials: 'omit'`，不会传账号 cookie。后端可缓存最近播放结果，避免每次访问博客都查询上游。

## 填写接入地址

等后端准备好，只改 `assets/js/music-config.js`：

```js
window.musicConfig = Object.freeze({
    recentEndpoint: 'https://你的后端地址/api/music/recent',
    limit: 5
});
```

同域也可填写 `/api/music/recent`。接口不得需要公开 token；token 应存在后端环境变量或服务端配置中。

提交该配置后推送 Blog。前端会显示加载、空记录或请求失败状态，8 秒超时；最多展示 10 首，默认 5 首。

## 后续“我喜欢”的歌曲

登录后用 `/user/playlist` 获取创建和收藏的歌单，确认“我喜欢”对应的 `listid`，再请求 `/playlist/track/all/new?listid=对应ID`。文档字段中有 `lisdid` 拼写错误，调用示例与源实现实际使用 `listid`。不要假定所有账号的“我喜欢”都是固定 ID，也不要在未验证歌单返回结果时保证该歌单能公开读取。
