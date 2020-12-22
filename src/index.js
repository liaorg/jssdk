import { uploadFile } from './uploadFile/init';

const opts = {
  // 容器
  container: document.getElementById('container'),
  // 上传接口
  url: {
    checkFile: '/admin/upload/checkfile',
    uploadFile: '/admin/upload/uploadfile',
    mergeFile: '/admin/upload/mergefile',
  },
  // 上传并发数
  limit: 5,
  // 切片大小 10M=10 * 1024 * 1024
  chunkSize: 10485760,
  // 上传大小限制字节 2G 1024*1024*1024*2
  uploadLimit: 2147483648,
  //uploadLimit: 10 * 1024 * 1024,
  // 上传文件类型限制，必填，默认支持：zip encryZip image(gif/png/jpe) png jpe gif
  typeLimit: 'zip',
  // 用户自定义文件类型判断函数，异步函数
  // 接收三个参数：file, blobToString, typeLimit
  customerCheckFileType: async (file, blobToString, typeLimit) => {
    const ret = await blobToString(file.slice(0, 100));
    // console.log('ret', ret)
    // 包含 update.tgz(75 70 64 61 74 65 2E 74 67 7A)
    // console.log('update.tgz', ret.indexOf('75 70 64 61 74 65 2E 74 67 7A'))
    return ret.indexOf('75 70 64 61 74 65 2E 74 67 7A') !== -1;
  },
  // 上传成功后的业务处理调用，参数为返回信息
  success: (data) => {
    console.log('response', data);
  },
};
uploadFile(opts);
