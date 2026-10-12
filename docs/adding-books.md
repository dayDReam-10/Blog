# 添加最近阅读的 PDF

DashBoard 的 Currently reading 模块从 `assets/data/books.js` 读取书单，PDF 由博客直接提供下载。当前没有提供书籍，因此书单留空。

1. 把要公开分享的 PDF 复制到 `D:\Allcode\Blog\assets\books\`，建议用英文文件名。
2. 编辑 `assets/data/books.js`，添加条目。例如文件实际为 `assets/books/my-book.pdf`：

```js
window.booksData = [
    {
        title: '书名',
        author: '作者',
        file: 'assets/books/my-book.pdf'
    }
];
```

多个条目用逗号分隔；按你希望展示的顺序填写，作者可省略。这里是填写示例，不会自动生成 PDF。页面只接受博客同域 `assets/books/` 里的 PDF 文件。

3. 本地预览 Project.html，点击下载，确认文件存在。
4. 提交配置与对应 PDF：

```powershell
Set-Location 'D:\Allcode\Blog'
git add -- 'assets/data/books.js' 'assets/books/my-book.pdf'
git commit -m '更新最近阅读'
git -c http.sslBackend=schannel -c http.version=HTTP/1.1 push origin main
```

推送后 PDF 会成为公开文件。仅放入可公开分发的书籍或你自己的资料；单个超过 GitHub 文件大小限制的 PDF 需要改用其他文件托管方案。
