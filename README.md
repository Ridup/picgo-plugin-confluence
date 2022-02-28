# picgo-plugin-confluence
支持上传到Confluence图库
PicGo Uploader For confluence

### Install

```bash
npm i picgo-plugin-confluence
```

### Usage

- Confluence网站地址
- 用户名
- 密码
- 页面编号

### 支持功能
- [x] 上传文件至指定的Confluence空间中
- [x] 使用cookies，减少每次上传请求用户验证的时间
- [ ] 持久化cookies，避免第一次打开软件上传的用户验证时间

### Demo
#### Config View
![](https://cdn.jsdelivr.net/gh/ridup/PicGo-Images/blog/202111302019938.png)
#### Upload View
![](https://cdn.jsdelivr.net/gh/ridup/PicGo-Images/blog/202111301956239.png)

### References
- [插件开发指南](https://picgo.github.io/PicGo-Core-Doc/zh/dev-guide/cli.html)
- [Using the Confluence REST API to upload an attachment to one or more pages](https://confluence.atlassian.com/confkb/using-the-confluence-rest-api-to-upload-an-attachment-to-one-or-more-pages-1014274390.html)
