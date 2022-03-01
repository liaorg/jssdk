原因：
   在上传插件的打包中，虽然已经将ES6的语法转换成了ES5，但是不知道为什么，箭头函数一直没有办法转换成正常函数，以至于在IE11下，打包好的代码并不能正常使用

解决：
   所以，将上传插件打包后的代码，又放到该目录下进行二次打包，就能将箭头函数转成正常函数了
   
步骤：
   1.先切换到目录jssdk，然后在命令行执行npm run build
   2.在dist目录下，复制出uploadfile.js（该文件还存在箭头函数）
   3.命令行切换到jssdk/babel/src
   4.将uploadfile.js文件复制到jssdk/babel/src
   5.执行npm run build
   6.在jssdk/babel/src/dist下得到uploadfile.js（该文件就是最终的文件）
   