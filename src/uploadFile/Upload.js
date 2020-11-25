import {
  $
} from '../common/utils'

import SparkMD5 from 'spark-md5'
import Axios from 'axios'

// 用 Symbol 作为key的方法 可以变为私有方法，不可枚举
// 只能通过 Object.getOwnPropertySymbols() 获取
const render = Symbol('reder')
const event = Symbol('event')
const style = `<style>
.upload-wrapper {
  font-size: 14px;
  width: 320px;
  color: #606266;
}

.upload-text {
  cursor: pointer;
  width: 318px;
}

.upload-btn {
  cursor: pointer;
  border-color: #409eff;
  background-color: #409eff;
  color: #fff;
  border: 1px solid #dcdfe6;
  padding: 2px 10px;
  border-radius: 4px;
}
.upload-btn:focus,.upload-btn:hover {
  border-color: #66b1ff;
  background-color: #66b1ff;
}

.upload-drag-wrapper {
  height: 60px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  text-align: center;
  position: relative;
}

.upload-input,
.upload-progress-wrapper {
  display: none;
}

.upload-drag-wrapper em {
  color: #409eff;
}

.processing-text {
  width: 100%;
  height: 100%;
  transition: opacity 1s;
  opacity: 0;
  display: -webkit-box;
  -webkit-box-orient: horizontal;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-flex: 4;
  position: absolute;
  left: 0;
  top: 0;
}

.processing-text.show {
  height: 100%;
  opacity: 1;
}

.drag-text {
  visibility: visible;
  height: auto;
  opacity: 1;
  transition: opacity 1s;
  position: absolute;
  top: 20px;
  width: 100%;
  left: 0;
}

.drag-text.hide {
  opacity: 0;
  height: 0;
}

.drag-filename {
  max-width: 80%;
  max-height: 41px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hash-progress {
  display: block;
  margin-left: 5px;
}

.upload-file-wrapper {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-tip {
    margin: 2px;
    padding: 0;
    height: 15px;
}
.upload-success {
  color: #67c23a;
}

.upload-error {
  color: #f56c6c;
}

.cube-container {
  width: 320px;
  margin-top: 5px;
}

.cube-container .cube {
  position: relative;
  width: 16px;
  height: 16px;
  line-height: 12px;
  border: 1px #ebeef5 solid;
  background-color: #ebeef5;
  float: left;
  margin-left: 1px;
  margin-top: 1px;
  opacity: 0.7;
}

.cube-container .cube>div {
  position: absolute;
  bottom: 0;
  width: 100%;
  transition: all 0.4s;
}

.cube-container .cube>.uploading {
  background: #409eff url(/static/images/loading.gif) no-repeat 50%;
}

.cube-container .cube>.success {
  background-color: #67c23a;
}

.cube-container .cube>.error {
  background-color: #f56c6c;
}

progress {
  height: 6px;
  border: none;
  border-radius: 100px;
  background-color: #ebeef5;
  vertical-align: middle;
  overflow: hidden;
  color: #67c23a;
  /*IE10*/
}

progress::-moz-progress-bar {
  background: #67c23a;
}

progress::-webkit-progress-bar {
  background: #ebeef5;
}

progress::-webkit-progress-value {
  background: #67c23a;
}
.progress-meter {
  color: #606266;
  display: inline-block;
  vertical-align: middle;
  margin-left: 5px;
  line-height: 1;
}
</style>`


class Upload {
  constructor(opts) {
    this.opts = opts
    this.file = null
    this.chunks = []
    // 计算hash中
    this.hashProgressing = false
    this.hash = null
    // hash进度
    this.hashProgress = 0
    // 文件上传中
    this.uploading = false

    this.$progress = null
    this.$progressMeter = null
    this.$uploadList = null
    this.$uploadTip = null
    this.$cubeContainer = null
    this.$dragText = null
    this.$processingText = null
    this.$dragFilename = null
    this.$hashProgress = null
    this.$uploadProgressWrapper = null

    // 执行页面渲染
    this[render](opts)
    // 绑定事件
    this[event](opts)
  }

  // 渲染上传表单
  [render](opts) {
    // id class 要加前缀 最好在增加随机数
    const tpl = style + `
            <div id="upload-wrapper" class="upload-wrapper">
                <div id="upload-text" class="upload-text">
                    <div id="upload-drag-wrapper" class="upload-drag-wrapper">
                        <span id="drag-text" class="drag-text">将文件拖到方框内，或<em>点击选择文件</em></span>
                        <span id="processing-text" class="processing-text">
                            <span id="drag-filename" class="drag-filename"></span>
                            <span id="hash-progress" class="hash-progress">0%</span>
                        </span>
                    </div>
                </div>
                <div class="upload-file-wrapper">
                    <p id="upload-tip" class="upload-tip"></p>
                    <label class="upload-file-label">
                        <span id="upload-list"></span>
                    </label>
                    <input id="uploadfile" type="file" class="upload-input"/>
                </div>
                <div id="upload-progress-wrapper" class="upload-progress-wrapper">
                    <label class="upload-progress-label">
                        <span class="progress-label">${opts.progressLabel}</span>
                        <progress id="progress" value="0" max="100">o(︶︿︶)o</progress>
                        <span id="progress-meter" class="progress-meter">0%</span>
                    </label>
                    <button id="upload-btn" class="upload-btn"><span>${opts.uploadBtnText}</span></button>
                    <div id="cube-container" class="cube-container"></div>
                </div>
            </div>
        `
    opts.container.innerHTML = tpl
  }
  // 绑定事件
  [event](opts) {
    const $uploadText = $('upload-text')
    const $uploadBtn = $('upload-btn')
    const $uploadfile = $('uploadfile')
    const $drag = $('upload-drag-wrapper')

    this.$progress = $('progress')
    this.$progressMeter = $('progress-meter')
    this.$uploadList = $('upload-list')
    this.$uploadTip = $('upload-tip')
    this.$cubeContainer = $('cube-container')

    this.$dragText = $('drag-text')
    this.$processingText = $('processing-text')
    this.$dragFilename = $('drag-filename')
    this.$hashProgress = $('hash-progress')
    this.$uploadProgressWrapper = $('upload-progress-wrapper')

    /**
     * 文件拖拽
     */
    $drag.addEventListener('dragenter', e => {
      // 文件拖拽进
      e.preventDefault()
      e.stopPropagation()
    })
    $drag.addEventListener('dragover', e => {
      // 文件拖拽在悬浮
      // 当被拖动的对象在另一对象容器范围内拖动时触发此事件
      e.preventDefault()
      e.stopPropagation()
      if (this.hashProgressing) {
        return
      }
      $drag.style.borderColor = '#409eff'
    })
    $drag.addEventListener('dragleave', e => {
      // 文件拖拽离开
      // 当被鼠标拖动的对象离开其容器范围内时触发此事件
      e.preventDefault()
      e.stopPropagation()
      if (this.hashProgressing) {
        return
      }
      $drag.style.borderColor = '#d9d9d9'
    })
    $drag.addEventListener('drop', e => {
      // 文件拖拽放下
      // 在一个拖动过程中，释放鼠标键时触发此事件
      e.preventDefault()
      e.stopPropagation()
      if (this.hashProgressing) {
        return
      }
      $drag.style.borderColor = '#d9d9d9'
      this.file = e.dataTransfer.files[0]
      this.processInit()
    })

    // 文件变化时
    $uploadfile.onchange = e => {
      const [file] = e.target.files
      if (!file) {
        return
      }
      this.file = file
      this.processInit()
    }
    $uploadText.onclick = e => {
      e.preventDefault(e)
      e.stopPropagation(e)
      if (this.hashProgressing) {
        return
      }
      $uploadfile.click()
    }

    /**
     * 文件上传
     */
    $uploadBtn.onclick = async () => {
      this.$uploadTip.innerText = ''
      // 表单验证
      if (!this.file) {
        this.uploadError('请选择文件')
        return
      }
      if (this.uploading) {
        this.uploadTip('文件上传中...')
        return
      }
      const status = await this.uploadFile()
      this.uploading = false
      // 上传成功
      if (status) {
        this.chunks.forEach((chunk, index) => {
          if (chunk.progress != 100) {
            // 渲染分片进度
            chunk.progress = 100
            this.cubePregress(chunk)
          }
        })
        this.setUploadProgress(100)
        this.uploadSuccess('上传成功')
        if (typeof this.opts.success === 'function') {
          this.opts.success()
        }
      } else {
        this.uploadError('文件上传失败')
      }
    }
  }

  uploadTip(msg) {
    this.$uploadTip.className = 'upload-tip'
    this.$uploadTip.innerText = msg
  }
  uploadError(msg) {
    this.$uploadTip.className = 'upload-tip upload-error'
    this.$uploadTip.innerText = msg
  }
  uploadSuccess(msg) {
    this.$uploadTip.className = 'upload-tip upload-success'
    this.$uploadTip.innerText = msg
  }

  // 处理文件初始化
  async processInit() {
    this.uploading = false
    this.hashProgressing = false
    this.chunks = []

    this.$uploadList.innerHTML = '文件：<b title="' + this.file.name + '">' + this.file.name + '</b><br>' +
      ' 大小：<b>' + this.getReadableSizeStr(this.file.size) + '</b>'

    // 文件大小判断
    if (this.file.uploadLimit && this.opts.uploadLimit < this.file.size) {
      this.uploadError('请上传不大于 ' + this.getReadableSizeStr(this.opts.uploadLimit) + ' 的文件')
      return
    }
    // 文件类型判断
    if (this.opts.typeLimit) {
      if (!await this.checkFileType()) {
        this.uploadError('请上传正确的文件')
        return
      }
    }

    this.$dragText.className += ' hide'
    this.$processingText.className += ' show'
    this.$dragFilename.innerText = '文件处理中 "' + this.file.name + '"'
    this.$hashProgress.innerText = '0%'
    this.$uploadProgressWrapper.style.display = 'none'
    this.$cubeContainer.innerHTML = ''
    // 计算文件 hash
    this.calculateHash()
  }
  // 文件类型判断
  async checkFileType() {
    let bType = true
    if (this.opts.typeLimit === 'zip') {
      bType = await this.isZip(this.file)
    }
    if (this.opts.typeLimit === 'image') {
      bType = await this.isImage(this.file)
    }
    // 用户自定义的判断函数
    if (typeof this.opts.checkFileType === 'function') {
      return bType && await this.opts.checkFileType(this.file, this.blobToString)
    }
    return bType
  }
  async blobToString(blob) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = function () {
        // console.log('reader', reader.result)
        const ret = reader.result.split('')
          .map(v => v.charCodeAt())
          .map(v => v.toString(16).toUpperCase())
          .map(v => v.padStart(2, '0'))
          .join(' ')
        resolve(ret)
      }
      reader.readAsBinaryString(blob)
    })
  }
  async isZip(file) {
    const ret = await this.blobToString(file.slice(0, 4))
    return (ret == '50 4B 03 04')
  }
  async isImage(file) {
    // 通过文件流来判定
    // 先判定是不是gif
    return await this.isGif(file) || await this.isPng(file) || await this.isJpg(file)
  }
  async isGif(file) {
    // GIF89a 和GIF87a
    // 前面6个16进制，'47 49 46 38 39 61' '47 49 46 38 37 61'
    // 16进制的抓安环
    const ret = await this.blobToString(file.slice(0, 6))
    const isGif = (ret == '47 49 46 38 39 61') || (ret == '47 49 46 38 37 61')
    return isGif
  }
  async isPng(file) {
    const ret = await this.blobToString(file.slice(0, 8))
    const ispng = (ret == '89 50 4E 47 0D 0A 1A 0A')
    return ispng
  }
  async isJpg(file) {
    const len = file.size
    const start = await this.blobToString(file.slice(0, 2))
    const tail = await this.blobToString(file.slice(-2, len))
    const isjpg = (start == 'FF D8') && (tail == 'FF D9')
    return isjpg
  }

  // 上传初始化
  uploadInit() {
    this.hashProgressing = false
    this.$uploadProgressWrapper.style.display = 'block'
    setTimeout(() => {
      this.$dragText.className = 'drag-text';
      this.$processingText.className = 'processing-text'
    }, 500)
    this.$uploadTip.innerText = ''
    this.setUploadProgress(0)
  }
  /**
   * 上传进度条
   */
  // hash 进度
  setHashProgress() {
    this.$hashProgress.innerText = this.hashProgress + '%'
  }
  // 渲染分片
  uploadCube() {
    let cube = []
    this.chunks.forEach((chunk, index) => {
      let cubeClass = ''
      if (chunk.progress == 100) {
        cubeClass = 'success'
      }
      cube[index] = `<div class="cube"><div id="${chunk.name}" class="${cubeClass}" style="height:${chunk.progress}%"></div></div>`
    })
    this.$cubeContainer.innerHTML = cube.join('')
  }
  // 分片进度
  cubePregress(chunk) {
    let cubeClass = 'uploading'
    if (chunk.progress == 100) {
      cubeClass = 'success'
    } else if (chunk.progress < 0) {
      chunk.progress = 50
      cubeClass = 'error'
    }
    let cube = document.getElementById(chunk.name)
    cube.style.height = `${chunk.progress}%`
    cube.className = cubeClass
  }
  // 整体进度
  uploadProgress() {
    if (!this.file || this.chunks.length) {
      this.setUploadProgress(0)
    }
    const loaded = this.chunks.map(item => item.chunk.size * item.progress)
      .reduce((acc, cur) => acc + cur, 0)
    let progress = parseInt((loaded / this.file.size).toFixed(2))
    // -10 因为要留10%给合并文件的请求
    progress = progress > 10 ? progress - 10 : progress
    this.setUploadProgress(progress)
  }
  setUploadProgress(progress) {
    this.$progressMeter.innerText = `${progress}%`
    this.$progress.value = progress
  }
  // 计算文件 hash
  async calculateHash() {
    this.hashProgressing = true
    // 计算分片
    const chunks = this.createFileChunk()
    // console.log('chunks', chunks)
    // 抽样计算文件 hash
    const hash = await this.calculateHashSample()
    // console.log(hash)
    // 利用 worker 计算文件 hash
    // const hash1 = await this.calculateHashWorker(chunks)
    // 利用浏览器空余时间计算 hash
    // const hash2 = await this.calculateHashIdle(chunks)
    // console.log(hash2)
    this.hash = hash
    // hash进度
    this.setHashProgress()
    this.chunks = chunks.map((chunk, index) => {
      // 切片的名字 hash+index
      const name = hash + '-' + index
      return {
        hash,
        name,
        index,
        chunk: chunk.file,
        progress: 0
      }
    })
    // console.log('this.chunks', this.chunks)
    // 上传文件初始化
    this.uploadInit()
    // 渲染分片
    this.uploadCube()
  }
  /**
   * 上传文件
   */
  async uploadFile() {
    if (!this.file) {
      console.log('请选择文件')
      return false
    }
    this.uploading = true
    // 判断格式
    // 问一下后端，文件是否上传过，如果没有，是否有存在的切片
    let checkData = {}
    try {
      checkData = await Axios.post(this.opts.url.checkFile, {
        hash: this.hash,
        ext: this.file.name.split('.').pop()
      })
    } catch (e) {
      this.uploadError('上传文件失败，请检查网络')
      return false
    }
    const {
      data: {
        data: {
          uploaded,
          uploadedList
        }
      }
    } = checkData
    if (uploaded) {
      // 秒传
      // console.log('秒传成功')
      return true
    }
    this.chunks.forEach((chunk, index) => {
      // 切片的名字 hash+index
      const name = this.hash + '-' + index
      chunk.progress = uploadedList.indexOf(name) > -1 ? 100 : 0
      // 渲染分片进度
      this.cubePregress(chunk)
    })
    this.uploadProgress()
    // 上传切片
    return await this.uploadChunks(uploadedList)
  }

  /**
   * 计算分片大小
   */
  createFileChunk() {
    const chunks = []
    let cur = 0
    while (cur < this.file.size) {
      chunks.push({
        index: cur,
        file: this.file.slice(cur, cur + this.opts.chunkSize)
      })
      cur += this.opts.chunkSize;
    }
    return chunks;
  }
  /**
   * 抽样计算文件 hash
   */
  async calculateHashSample() {
    // 布隆过滤器  判断一个数据存在与否
    // 1个G的文件，抽样后5M以内
    // hash一样，文件不一定一样
    // hash不一样，文件一定不一样
    return new Promise(resolve => {
      const spark = new SparkMD5.ArrayBuffer()

      const appendToSpark = async file => {
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.readAsArrayBuffer(file)
          reader.onload = e => {
            spark.append(e.target.result)
            resolve()
          }
        })
      }

      (async () => {
        const file = this.file
        const size = file.size
        // 2M = 2 * 1024 * 1024
        const offset = 2097152
        let chunk = file.slice(0, offset)
        await appendToSpark(chunk)
        let progress = Number(
          ((100 * offset) / size).toFixed(2)
        )
        this.hashProgress = progress > 100 ? 100 : progress
        this.setHashProgress()
        let cur = offset
        while (cur < size) {
          if (cur + offset >= size) {
            // 最后一个区快
            chunk = file.slice(cur, cur + offset)
            await appendToSpark(chunk)
          } else {
            // 中间的区块
            const mid = cur + offset / 2
            const end = cur + offset
            let chunks = []
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
            await appendToSpark(new Blob(chunks))
          }
          cur += offset
          progress = Number(
            ((100 * cur) / size).toFixed(2)
          )
          this.hashProgress = progress > 100 ? 100 : progress
          this.setHashProgress()
        }
        this.hashProgress = 100
        resolve(spark.end())
      })()
    })
  }
  /**
   * 利用 worker 计算文件 hash
   */
  async calculateHashWorker(chunks) {
    return new Promise(resolve => {
      this.worker = new Worker('/static/js/hash.js')
      this.worker.postMessage({
        chunks: chunks
      })
      this.worker.onmessage = e => {
        const {
          progress,
          hash
        } = e.data
        this.hashProgress = Number(progress.toFixed(2))
        if (hash) {
          resolve(hash)
        }
      }
    })
  }
  /**
   * 借鉴fiber架构，利用浏览器空闲时间计算文件 hash
   * 60fps 1秒渲染60次 渲染1次 1帧，大概16.6ms
   * |帧(system task，render，script)空闲时间  |帧 painting idle   |帧   |帧   |
   */
  async calculateHashIdle(chunks) {
    const len = chunks.length
    return new Promise(resolve => {
      const spark = new SparkMD5.ArrayBuffer()
      let count = 0

      const appendToSpark = async file => {
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.readAsArrayBuffer(file)
          reader.onload = e => {
            spark.append(e.target.result)
            resolve()
          }
        })
      }
      const workLoop = async deadline => {
        // timeRemaining获取当前帧的剩余时间
        while (count < len && deadline.timeRemaining() > 1) {
          // 空闲时间，且有任务
          await appendToSpark(chunks[count].file)
          count++
          if (count < len) {
            this.hashProgress = Number(
              ((100 * count) / len).toFixed(2)
            )
            this.setHashProgress()
          } else {
            this.hashProgress = 100
            resolve(spark.end())
          }
        }
        window.requestIdleCallback(workLoop)
      }
      // 浏览器一旦空闲，就会调用workLoop
      window.requestIdleCallback(workLoop)
    })
  }

  /**
   * 上传文件分片
   * @param {Array} uploadedList
   */
  async uploadChunks(uploadedList = []) {
    const requests = this.chunks
      // 过滤已经上传过的
      .filter(chunk => uploadedList.indexOf(chunk.name) == -1)
      .map((chunk, index) => {
        // 转成promise
        const form = new FormData()
        form.append('chunk', chunk.chunk)
        form.append('hash', chunk.hash)
        form.append('name', chunk.name)
        // form.append('index',chunk.index)
        return {
          form,
          index: chunk.index,
          error: 0
        }
      })
    // 当是 sendRequest 时要注释掉 map 和 await Promise.all(requests)
    // .map(({
    //     form,
    //     index
    // }) => Axios.post(this.opts.url.uploadFile, form, {
    //     onUploadProgress: progress => {
    //         // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算
    //         this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
    //         this.cubePregress(this.chunks[index])
    //     }
    // }).then(() => {
    //     this.uploadProgress()
    // }))
    // await Promise.all(requests)
    // @todo 并发量控制 
    // 尝试申请tcp链接过多，也会造成卡顿
    // 异步的并发控制，
    const requestStatus = await this.sendRequest(requests)
    // console.log('requestStatus', requestStatus)
    if (!requestStatus) {
      return requestStatus
    }

    const mergeStatus = await this.mergeRequest()
    // console.log('mergeStatus', mergeStatus)
    // if (mergeStatus) {
    //   this.setUploadProgress(100)
    // }
    return mergeStatus
  }


  /**
   * TCP慢启动，先上传一个初始区块，比如10KB，根据上传成功时间，决定下一个区块仕20K，hi是50K，还是5K
   * 在下一个一样的逻辑，可能编程100K，200K，或者2K
   * 上传可能报错
   * 报错之后，进度条变红，开始重试
   * 一个切片重试失败三次，整体全部终止
   * 
   * 有控制的发送请求
   * @param {Object} requests
   */
  async sendRequest(requests) {
    // limit仕并发数
    // 一个数组,长度仕limit
    // [task12,task13,task4]
    let limit = this.opts.limit
    return new Promise((resolve, reject) => {
      const len = requests.length
      let counter = 0
      let isStop = false
      const start = async () => {
        if (isStop) {
          return
        }
        const task = requests.shift()
        if (task) {
          const {
            form,
            index
          } = task
          // 上传开始给一个初始值
          this.chunks[index].progress = 15
          this.cubePregress(this.chunks[index])
          try {
            await Axios.post(this.opts.url.uploadFile, form, {
              onUploadProgress: progress => {
                // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算
                this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
              }
            }).then(() => {
              this.cubePregress(this.chunks[index])
              this.uploadProgress()
            })
            if (counter == len - 1) {
              // 最后一个任务
              resolve(true)
            } else {
              counter++
              // 启动下一个任务
              start()
            }
          } catch (e) {
            this.chunks[index].progress = -1
            this.cubePregress(this.chunks[index])
            if (e.response.status === 413) {
              isStop = true
              this.uploading = false
              this.uploadError('文件上传失败，上传文件大小超出服务器限制')
              reject(false)
            } else {
              if (task.error < 3) {
                task.error++
                requests.unshift(task)
                start()
              } else {
                // 错误三次
                isStop = true
                this.uploading = false
                this.uploadError('文件上传失败，请重新上传')
                reject(false)
              }
            }
          }
        }
      }

      while (limit > 0) {
        // 启动limit个任务
        start()
        // 模拟一下延迟
        // setTimeout(() => {
        //     start()
        // }, Math.random() * 2000)
        limit -= 1
      }
    })
  }
  /**
   * 文件合并
   */
  async mergeRequest() {
    const ret = await Axios.post(this.opts.url.mergeFile, {
      ext: this.file.name.split('.').pop(),
      size: this.opts.chunkSize,
      hash: this.hash
    })
    // console.log('ret', ret)
    return !ret.code
  }
  /**
   * 把文件大小转换为易读的单位
   * MB 是以 1000 为阶的，MiB 是以 1024 为阶的
   * @param {Number} bytes 
   */
  getReadableSizeStr(bytes) {
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let pointer = 0;
    while (bytes > 1024 && pointer < units.length) {
      bytes /= 1024;
      pointer++;
    }
    // 小数点后两位
    bytes = Math.round(bytes * 100) / 100;
    return bytes + units[pointer];
  }
}

export default Upload