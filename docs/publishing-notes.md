# 上传新笔记

博客从 `notes/*.txt` 生成 `assets/data/notes_data.js`。只上传原始 Markdown 到 CTF 仓库，不会自动出现在博客中。

## 1. 准备文章与图片

在 `notes` 新建一个 UTF-8 编码的 `.txt` 文件。正文使用 Markdown，文件开头添加元数据。下面是新笔记的填写示例：

```text
Title: 我的新笔记
DateTime: 2026.10.12 / 20:00
Id: 20261012-new-note
Order: 13
Status: Android Reverse Engineering
Color: #f97316
---
# 我的新笔记

这里开始写正文。

## 背景

正文中的英文术语可以使用反引号。

![分析流程](assets/images/new-note/images/flow.png)
```

元数据和正文之间的 `---` 必须保留。`Id` 要唯一，同一天的多篇文章也要使用不同 ID；已发布文章的 ID 尽量不要改，以免旧链接失效。

| 字段 | 作用 |
| --- | --- |
| Title | 文章页与首页标题 |
| DateTime | 发布日期与时间；首页各模块以它决定最新文章，不显示日期 |
| Id | 文章链接使用的唯一标识 |
| Order | 生成数据时的顺序；模块里的文章仍按 DateTime 从新到旧展示 |
| Status | 首页小字，也是模块分类依据 |
| Color | 小字颜色 |

`Status` 含 `Reverse`、`Security`、`Environment Detection`、`ELF`、`Ptrace` 或 `Pwn` 时进入 RE 模块；标题含“逆向”或“RE笔记”也进入 RE。其他文章进入 PERSONAL JOURNAL。随笔可填 `Personal Essay`，近况可填 `System Update`。

图片统一放到 `assets/images/文章英文名/images/`。引用路径以博客根目录为起点，用正斜杠；不要填写本机的 `D:\` 路径，也不要用相对于 `notes` 的 `../`。上面的示例需要实际放入 `assets/images/new-note/images/flow.png`；没有图片就删除图片那行。

标题支持 `#` 到 `######`，井号后保留一个空格。代码块的三反引号要成对。

## 2. 生成博客数据

在 PowerShell 中：

```powershell
Set-Location -LiteralPath 'D:\Allcode\Blog'
& .\scripts\build_notes.ps1
git status --short
git diff --stat
```

确认输出中出现新文件，且总文章数增加。不要直接手改 `notes_data.js`：下一次构建会覆盖它。

## 3. 本地预览

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8765/index.html`，展开所属模块，检查标题和图片；也可直接打开 `http://127.0.0.1:8765/article.html?id=20261012-new-note`。结束后在终端按 Ctrl+C。

## 4. 提交并推送 Blog

下面的文件名与图片目录对应第 1 步示例，使用时换成自己的名字；无图片时跳过图片目录的 add。

```powershell
git add -- 'notes/我的新笔记.txt' 'assets/images/new-note/images' 'assets/data/notes_data.js'
git diff --cached --stat
git commit -m '添加新笔记'
git -c http.sslBackend=schannel -c http.version=HTTP/1.1 push origin main
```

推送完成后等待 GitHub Pages 更新，检查线上文章。修改旧文章也是先改 `notes`，再构建、提交、推送。

## 5. 同步原始笔记到 CTF（需要时）

CTF 与 Blog 是两个独立仓库，需要各自提交推送。原始 Markdown 与图片保持自己的目录结构，例如 `D:\writeup\re\Android\文章目录\`；这里的图片路径应相对于该 Markdown 文件。

```powershell
Set-Location -LiteralPath 'D:\writeup'
git add -- 're/Android/文章目录'
git diff --cached --stat
git commit -m '添加新笔记'
git -c http.sslBackend=schannel -c http.version=HTTP/1.1 push origin master
```

仅添加本次文章目录，以免把仓库里其他尚未完成的改动一起提交。
