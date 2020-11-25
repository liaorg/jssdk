# UtilsSDK 工具

### 打包说明
```
npm i

修改配置文件 webpack.config.js

npm run build
或
npm start

```

### 上传文件功能
```
<script src="./dist/uploadfile.js"></script>
<script>
    const opts = {
        // 容器
        container: document.getElementById('container'),
        // 文字
        uploadBtnText: '上传',
        progressLabel: '上传进度',
        // 上传接口
        url: {
            checkFile: '/checkfile',
            uploadFile: '/uploadfile',
            mergeFile: '/mergefile',
        },
        // 上传并发数
        limit: 4,
        // 切片大小 10M = 10 * 1024 * 1024
        chunkSize: 10485760,
        // 上传大小限制字节 100M = 100 * 1024 * 1024
        uploadLimit: 104857600,
        // 上传文件类型限制
        typeLimit: 'zip',
        // 特定的文件类型判断函数，异步函数
        checkFileType: null,
        // 上传成功后的业务处理调用
        success: null
    }
    UtilsSDK.uploadFile(opts)
<script>
```

