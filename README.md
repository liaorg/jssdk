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

```javascript
<script src="./dist/uploadfile.js"></script>
<script>
    const uploadOpts = {
        // 容器
        container: document.getElementById('container'),
        // 文字
        uploadBtnText: '上传',
        progressLabel: '上传进度',
        // 上传提示
        dragText: '将文件拖到方框内，或 <em>点击选择文件</em>',
        uploadTipLoading: '已有文件在上传中...',
        uploadTipChoiceFile: '请选择文件',
        uploadTipSuccess: '上传成功',
        uploadTipFilename: '文件：',
        uploadTipFileSize: '大小：',
        uploadTipFileSizeLess: '请上传不大于',
        uploadTipFile: '的文件',
        uploadTipFileCheck: '请上传正确的文件',
        uploadTipHandleFile: '文件处理中',
        uploadTipFailedNetwork: '上传文件失败，请检查网络',
        uploadTipFast: '秒传成功',
        uploadTipFailedSize: '文件上传失败，切片大小超出限制',
        uploadTipFailedType: '文件上传失败，文件类型错误',
        uploadTipFailedAuth: '文件上传失败，没有操作权限',
        uploadTipFailedMore: '文件上传失败，连续多次上传错误',
        uploadTipFailed: '上传失败',
        uploadTipFailedUnknow: '文件上传失败，未知错误',
        uploadTipFailedHash: '文件上传失败，文件 hash 错误',
        uploadTipMeregSuccess: '合并切片成功',

        // 上传接口
        url: {
            checkFile: '/checkfile',
            uploadFile: '/uploadfile',
            mergeFile: '/mergefile',
        },
        // 上传并发数
        limit: 5,
        // 切片大小 10M = 10 * 1024 * 1024
        chunkSize: 10485760,
        // 上传大小限制字节 100M = 100 * 1024 * 1024
        uploadLimit: 104857600,
        // 上传文件类型限制，必填，默认支持：zip encryZip(加密的) image(gif/png/jpe) png jpe gif
        typeLimit: 'zip',
        // 用户自定义文件类型判断函数，异步函数
        // 接收三个参数：file, blobToString, typeLimit
        // 返回 true|false
        customerCheckFileType: null,
        // 上传成功后的业务处理调用
        success: null,
        // 上传失败后的业务处理调用
        error: null,
    }
    UtilsSDK.uploadFile(uploadOpts)
</script>
```

```javascript
es6模块：
import { uploadFile } from './uploadfile';
uploadFile(uploadOpts);
```
