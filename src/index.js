import {
    uploadFile
} from './uploadFile/init'

const opts = {
    container: document.getElementById('container'),
    url: {
        checkFile: '/admin/upload/checkfile',
        uploadFile: '/admin/upload/uploadfile',
        mergeFile: '/admin/upload/mergefile',
    },
    // 上传并发数
    limit: 5,
    // 切片大小
    chunkSize: 10 * 1024 * 1024
}
uploadFile(opts)