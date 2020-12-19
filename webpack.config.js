const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const glob = require('glob');

const setMPA = () => {
  const entry = {};
  const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));
  entryFiles.map((item, index) => {
    const entryFile = entryFiles[index];
    const match = entryFile.match(/src\/(.*)\/index\.js$/);
    const pageName = match && match[1];
    entry[pageName] = entryFile;
  });
  return {
    entry,
  };
};
const { entry } = setMPA();

module.exports = {
  // entry: path.join(__dirname, `src/index.js`),
  // entry: {
  //     polyfill: ['core-js/stable', 'whatwg-fetch'],
  //     main: path.join(__dirname, `src/index.js`),
  // },
  entry: path.join(__dirname, `src/uploadFile/init.js`),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'uploadfile.js',
    chunkFilename: '[name].[contenthash:6].chunk.js',
    library: ['UtilsSDK'],
    libraryTarget: 'umd',
  },
  mode: 'production', // development production
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  devtool: 'cheap-module-source-map', // eval-cheap-module-source-map cheap-module-source-map
  // optimization: {
  //     splitChunks: {
  //         chunks(chunk) {
  //             return chunk.name !== 'polyfill'
  //         }
  //     }
  // },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, `src/index.html`),
      filename: 'index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
      // inject: false
    }),
    new CleanWebpackPlugin(),
  ],
  devServer: {
    overlay: true, // 显示打包中出现的错误
    contentBase: path.join(__dirname, 'dist'), // 根目录
    compress: true, // 是否压缩
    port: 8080, // 监听端口, 默认8080
    open: true, // 是否自动打开浏览器
    proxy: {
      // 转发，代理 ， 跨域
      '/admin': {
        target: 'https://10.5.20.121',
        secure: false,
      },
    },
  },
};
