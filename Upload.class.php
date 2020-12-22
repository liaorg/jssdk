<?php

namespace Common\Util;

/**
 * 文件上传类类
 * @package Common\Util
 * $config = array(
 *      // web根路径
 *      'webRoot' => '/www/',
 *      // 上传文件路径
 *      'uploadDir' => '/tmp/Upload/',
 *      // 分片文件路径
 *      'chunkDir' => '/tmp/Upload/',
 *      // 是否自动设置上传路径
 *      // 当为 true 时，会根据/tmp 上当的大小，
 *      // 将上传路径自动设置为 /tmp/Upload/ 目录或者 webRoot/Upload/
 *      'autoSetPath' => true,
 *      // 判断/tmp/空间的倍数
 *      'tmpMultiple' => 2,
 *      // 分片大小 切片大小 10M = 10 * 1024 * 1024 = 10485760
 *      'chunkSize' => 10485760,
 *      // 最小空间 100M
 *      'frozenSize' => 104857600,
 *      // 上传文件类型限制
 *      // 必须有值且前端传值必须与此相同
 *      'typeLimit' => 'zip',
 *  );
 *  $upload = new Upload($config);
 *  // 要实现的接口调用
 *  // 文件检查
 *  $result = $upload->checkfile();
 *  // 分片文件上传
 *  $result = $upload->uploadfile();
 *  // 分片文件合并
 *  $result = $upload->mergefile();
 */
class Upload
{
    /**
     * @var 初始参数设置
     */
    public $opts;
    
    public function __construct($config = array())
    {
        $this->opts = array(
            // web根路径
            'webRoot' => '/www',
            // 上传文件路径
            'uploadDir' => '/tmp/Upload/',
            // 分片文件路径
            'chunkDir' => '/tmp/Upload/',
            // 是否自动设置上传路径
            // 当为 true 时，会根据/tmp 上当的大小，
            // 将上传路径自动设置为 /tmp/Upload/ 目录或者 webRoot/Upload/
            'autoSetPath' => true,
            'tmpMultiple' => 2,
            // 分片大小 切片大小 10M = 10 * 1024 * 1024 = 10485760
            'chunkSize' => 10485760,
            // 最小空间 100M
            'frozenSize' => 104857600,
            // 上传文件类型限制，默认支持：zip encryZip image(gif/png/jpe) png jpe gif
            // 必须有值且前端传值必须与此相同
            'typeLimit' => 'zip',
            'file' => array(),
        );
        $this->opts = array_merge($this->opts, $config);
    }

    // 文件检查
    public function checkfile()
    {
        $startTime = time();
        // 获取接口传的参数
        $params = $this->getParams();
        $ext = $params['ext'];
        $hash = trim($params['hash']);
        $oldHash = $hash;
        $hash = $hash ? md5($hash) : '';
        $filesize = $params['filesize'];
        $freeSize = $this->initUploadDir($filesize, $hash, 0);

        $this->opts['file'] = array(
            'oldHash' => $oldHash,
            'hash' => $hash,
            'ext' => $ext
        );
        
        if (!$hash) {
            $hash = md5(time());
        }
        $filePath = $this->opts['uploadDir'] . "$hash.$ext";
        $chunkDir = $this->opts['chunkDir'] . "$hash";

        $uploaded = false;
        $uploadedList = [];
        if (file_exists($filePath)) {
          // 文件存在
          $uploaded = true;
        } else {
          $uploadedList = $this->getUploadedList($chunkDir);
        }
        $token = uniqid();
        $_SESSION['uploadToken'] = $token;
        
        return array(
          'status' => 1,
          'code' => 0,
          'data' => array(
              'uploaded' => $uploaded,
              'uploadedList' => $uploadedList,
              'freeSize' => $freeSize,
              'startTime' => $startTime,
              'token' => $token,
              'upgradeTip' => '',
              'upgradeparam' => '',
          )
        );
    }
    // 文件上传
    public function uploadfile()
    {
        $token = trim($_POST['token']);
        // $name = trim($_POST['name']);
        $index = trim($_POST['index']);
        $hash = trim($_POST['hash']);
        $oldHash = $hash;
        $hash = $hash ? md5($hash) : '';
        $typeLimit = trim($_POST['typeLimit']);
        $actualType = trim($_POST['actualType']);
        $first = trim($_POST['first']);
        $last = trim($_POST['last']);
        // 模拟报错
        /* if(random_int(0, 10) > 2){
          return array(
              'status' => 0,
              'code' => 500,
              'data' => array(
                'errmsg' => 'error',
              )
          );
        } */
        // token 不正确
        if ($token !== $_SESSION['uploadToken']) {
            return array(
                'status' => 0,
                'code' => 403,
                'data' => array(
                    'errmsg' => 'token error',
                )
            );
        }
        // 对上传文件的判断
        if ($_FILES['chunk']['error'] != 0) {
            $errors = array(
                0 => 'There is no error, the file uploaded with success',
                1 => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
                2 => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
                3 => 'The uploaded file was only partially uploaded',
                4 => 'No file was uploaded',
                6 => 'Missing a temporary folder',
                7 => 'Failed to write file to disk.',
                8 => 'A PHP extension stopped the file upload.',
            );
            $errmsg = $errors[$_FILES['chunk']['error']] ? $errors[$_FILES['chunk']['error']] : 'server error';
            return array(
                'status' => 0,
                'code' => 500,
                'data' => array(
                    'errmsgCode' => $_FILES['chunk']['error'],
                    'errmsg' => $errmsg,
                )
            );
        }
        // 415 是格式错误 413 请求的实体过大
        // 判断大小 切片大小 10M = 10 * 1024 * 1024
        if ($_FILES['chunk']['size'] > $this->opts['chunkSize']) {
            return array(
                'status' => 0,
                'code' => 413,
                'data' => array(
                    'errmsg' => 'filesize error',
                )
            );
        }
        $filesize = trim($_POST['filesize']);
        $freeSize = trim($_POST['freeSize']);
        $this->initUploadDir($filesize, $hash, $freeSize);
        
        $this->opts['file'] = array(
            'oldHash' => $oldHash,
            'hash' => $hash
        );
        $chunkDir = $this->opts['chunkDir'] . "$hash";
        if (!is_dir($chunkDir)) {
          mkdir($chunkDir);
          chmod($chunkDir, 0777);
        }
        // 文件类型判断，判断文件头信息，所以只判断第一个分片文件就行了
        // 不是上传第一个分片，要检查是否有第一个分片，如果没有要检查当前分片
        $firstFileName = "$hash/$hash-0";
        if (!$this->opts['typeLimit'] || $this->opts['typeLimit'] !== $typeLimit) {
            return array(
                'status' => 0,
                'code' => 412,
                'data' => array(
                    'errmsg' => 'filetype set error'
                )
            );
        }
        // 是否要进行类型检查
        $checkType = false;
        $firstExist = is_file($this->opts['chunkDir'] . $firstFileName);
        if ($first == 1 || !$firstExist) {
            $checkType = true;
            if (!$this->checkFileType($this->opts['typeLimit'], $_FILES['chunk']['tmp_name'])) {
                // 删除上传的文件
                $this->rmFile($chunkDir);
                return array(
                    'status' => 0,
                    'code' => 412,
                    'data' => array(
                        'errmsg' => 'filetype error'
                    )
                );
            }
        }
        // 如果是jpg的文件还要判断最后2字节的内容
        if ($last && $actualType == 'jpg') {
            if (!$this->isJpgEnd($_FILES['chunk']['tmp_name'])) {
                // 删除上传的文件
                $this->rmFile($chunkDir);
                return array(
                    'status' => 0,
                    'code' => 412,
                    'data' => array(
                        'errmsg' => 'jpg filetype error'
                    )
                );
            }
        }

        $filename = $chunkDir . '/' . $hash . '-' .$index;
        move_uploaded_file($_FILES['chunk']['tmp_name'], $filename);
        return array(
          'status' => 1,
          'code' => 0,
          'data' => array(
            'msg' => '切片上传成功',
            'checkType' => $checkType
          )
        );
    }
    // 文件合并
    public function mergefile()
    {
        $params = $this->getParams();
        $token = $params['token'];
        $ext = $params['ext'];
        $hash = trim($params['hash']);
        $oldHash = $hash;
        $hash = $hash ? md5($hash) : '';
        $startTime = $params['startTime'];
        $startTime = $startTime ? $startTime : time();

        $filesize = $params['filesize'];
        $freeSize = $params['freeSize'];

        // token 不正确
        if (trim($token) !== $_SESSION['uploadToken']) {
            return array(
                'status' => 0,
                'code' => 403,
                'data' => array(
                    'errmsg' => 'token error',
                )
            );
        }

        $this->initUploadDir($filesize, $hash, $freeSize);

        $filename = $hash.'.'.$ext;
        $this->opts['file'] = array(
            'oldHash' => $oldHash,
            'hash' => $hash,
            'ext' => $ext
        );
        $filePath = $this->opts['uploadDir'] . $filename;
        $chunkDir = $this->opts['chunkDir'] . "$hash";

        $chunks = $this->getUploadedList($chunkDir);
        // 文件重新排序
        usort($chunks, function($a, $b){
          return explode('-', $a)[1] - explode('-', $b)[1];
        });
        // 合并操作
        $handle = fopen($filePath, 'ab');
        foreach ($chunks as $key => $file) {
            foreach ($this->readFile($chunkDir . '/' .$file) as $n => $line) {
              // 把读取的文件流到新文件中
              fwrite($handle, $line);
            }
            // 删除旧文件
            $this->rmFile($chunkDir . '/' .$file);
        }
        fclose($handle);
        unset($handle);
        // 为安全起见再要同时删除一下旧的2个有可能存储临时文件的目录
        if ($hash){
            $cmd = "rm -rf /tmp/Upload/$hash/* ;rm -rf " . $this->opts['webRoot'] . "/Upload/$hash/* ;";
            $cmd = "/mnt/heidun/apacheroot '$cmd'";
            exec($cmd);
        }
        // 比较合并后的文件
        $md5sum = $this->calculateHashSample($filePath);
        $endTime = time();
        $spentTime = $endTime - $startTime;
        if ($md5sum !== $oldHash) {
            $this->rmFile($filePath);
            return array(
                'status' => 0,
                'code' => 412,
                'data' => array(
                    'errmsg' => 'file hash error',
                )
            );
        }
        return array(
          'status' => 1,
          'code' => 0,
          'data' => array(
            'spentTime' => $spentTime,
            'msg' => '合并文件成功',
            'upgradeTip' => '',
            'upgradeparam' => '',
          )
        );
    }
    /**
    * 获取配置信息
    *
    */
    public function getOpts()
    {
        return $this->opts;
    }
    
    /**
    * 删除文件或目录
    *
    */
    public function rmFile($file)
    {
        if (is_dir($file)) {
            $file = realpath($file);
            if ($file == '/' || $file == '/tmp') {
                return;
            }
        }
        $cmd = 'rm -rf '.$file;
        $cmd = "/mnt/heidun/apacheroot '$cmd'";
        return exec($cmd);
    }
    
    /**
    * 将字符串转换为 16 进制显示
    * 如： PK => 50 4B
    */
    public function blobToString($blob)
    {
        $char = str_split($blob);
        // charCodeAt
        array_walk($char, function(&$value, $key) {
            list(,$ord) = unpack('N',mb_convert_encoding($value,'UCS-4BE','UTF-8'));
            $value = str_pad(strtoupper(dechex($ord)), 2, '0', STR_PAD_LEFT);
        });
        return implode(' ', $char);
    }
    /**
    * 抽样计算文件 hash
    */
    private function calculateHashSample($file)
    {
        // 布隆过滤器  判断一个数据存在与否
        // 1个G的文件，抽样后5M以内
        // hash一样，文件不一定一样
        // hash不一样，文件一定不一样
        // 2M = 2 * 1024 * 1024
        $offset = 2097152;
        $size = filesize($file);
        $chunks = array();
        $cur = $offset;
        $handle = fopen($file, 'rb');
        // 第一块
        $chunk = fread($handle, $offset);
        array_push($chunks, $chunk);
        while ($cur < $size) {
            if ($cur + $offset >= $size) {
                // 最后一个区快
                fseek($handle, $cur);
                $chunk = fread($handle, $offset);
                array_push($chunks, $chunk);
            } else {
                // 中间的区块
                $mid = $cur + $offset / 2;
                $end = $cur + $offset;
                fseek($handle, $cur);
                $chunk = fread($handle, 2);
                array_push($chunks, $chunk);
                fseek($handle, $mid);
                $chunk = fread($handle, 2);
                array_push($chunks, $chunk);
                fseek($handle, $end - 2);
                $chunk = fread($handle, 2);
                array_push($chunks, $chunk);
            }
            $cur += $offset;
        }
        fclose($handle);
        unset($handle);
        return md5(implode($chunks));
    }
    
    // 检测文件类型
    private function checkFileType($typeLimit, $filename)
    {
        $bType = true;
        $typeLimit = strtolower($typeLimit);
        switch ($typeLimit) {
          case 'encryzip':
            $bType = $this->isZip($filename) && $this->isEncryptZip($filename);
            break;
          case 'zip':
            $bType = $this->isZip($filename);
            break;
          case 'image':
            $bType = $this->isImage($filename);
            break;
          case 'png':
            $bType = $this->isPng($filename);
            break;
          case 'jpg':
            $bType = $this->isJpg($filename);
            break;
          case 'gif':
            $bType = $this->isGif($filename);
            break;
          default:
            break;
        }
        return $bType;
    }

    // 获取 /tmp 目录大小
    private function getTmpDirFreeSize()
    {
      $cmd = 'df /tmp';
      $cmd = "/mnt/heidun/apacheroot '$cmd'";
      exec($cmd, $result, $i);
      $size = preg_split ('/[\s]+/', $result[1]);
      $freeSize = trim($size[3]) - 0;
      return $freeSize * 1024;
    }
    /**
    * 初始化上传文件目录
    *
    */
    private function initUploadDir($filesize, $hash, $freeSize = null)
    {
      if (!$this->opts['autoSetPath']){
          return 0;
      }
      // 检测 /tmp 剩余目录大小是否够升级用
      if (!$freeSize) {
        $freeSize = $this->getTmpDirFreeSize();
      }
      if ($freeSize > $filesize * $this->opts['tmpMultiple'] + $this->opts['frozenSize']) {
          // 大于上传文件的 2倍多100M
          $this->opts['uploadDir'] = '/tmp/Upload/';
          $this->opts['chunkDir'] = '/tmp/Upload/';
      } elseif ($freeSize > $filesize + $this->opts['frozenSize']) {
          // 大于上传文件的 1倍多100M
          $this->opts['uploadDir'] = $this->opts['webRoot'] . '/Upload/';
          $this->opts['chunkDir'] = '/tmp/Upload/';
      } else {
          $this->opts['uploadDir'] = $this->opts['webRoot'] . '/Upload/';
          $this->opts['chunkDir'] = $this->opts['webRoot'] . '/Upload/';
      }
      // 如果内存中已经存在 hash 分片目录且目录中有文件
      $cmd = 'ls /tmp/Upload/' . $hash.' -l | grep "^-" | wc -l';
      $cmd = "/mnt/heidun/apacheroot '$cmd'";
      exec($cmd, $res, $i);
      if ($res[0] > 0) {
          $this->opts['chunkDir'] = '/tmp/Upload/';
      }
      return $freeSize;
    }

    /**
    * 读文件 生成器方式
    *
    */
    private function readFile($file)
    {
        // 打开文件
        $handle = fopen($file, 'rb');
        while (feof($handle) === false) {
            // 重点每次读取 1024 个字节
            yield fread($handle, 10240);
        }
        fclose($handle);
        unset($handle);
    }

    /**
    * 获取上传的文件
    *
    */
    private function getUploadedList($dirPath)
    {
        if (is_dir($dirPath)) {
            $files = scandir($dirPath);
            $files = array_filter($files, function($file, $key){
                if ($file != '.' && $file != '..') {
                    return true;
                } else {
                    return false;
                }
            }, ARRAY_FILTER_USE_BOTH);
            return array_values($files);
        } else {
          return [];
        }
    }
    // 是否 zip 文件
    private function isZip($filename)
    {
        $blob = file_get_contents($filename, NULL, NULL, 0, 4);
        $headFlag = $this->blobToString($blob);
        return $headFlag === '50 4B 03 04';
    }
    // 是否加密 zip 文件
    private function isEncryptZip($filename)
    {
        // offset 6, general purpose bit flag: (2 bytes)
        // bit 0: if set, indicates that the file is encrypted
        $blob = file_get_contents($filename, NULL, NULL, 6, 1);
        $flag = $this->blobToString($blob);
        $zipBit = dechex(hexdec($flag));
        $zipEncryptFlag = 0x1;
        $utf8Flag = 0x800;
        return ($zipBit | $utf8Flag) & $zipEncryptFlag;
    }
    // 是否 gif 文件
    private function isGif($filename)
    {
        $blob = file_get_contents($filename, NULL, NULL, 0, 6);
        $headFlag = $this->blobToString($blob);
        return $headFlag === '47 49 46 38 39 61' || $headFlag === '47 49 46 38 37 61';
    }
    // 是否 png 文件
    private function isPng($filename)
    {
        $blob = file_get_contents($filename, NULL, NULL, 0, 8);
        $headFlag = $this->blobToString($blob);
        return $headFlag === '89 50 4E 47 0D 0A 1A 0A';
    }
    // 是否 jpg 文件
    private function isJpg($filename)
    {
        // jpg 还在判断，文件最后2个字节为 FF D9
        $blob = file_get_contents($filename, NULL, NULL, 0, 2);
        $headFlag = $this->blobToString($blob);
        return $headFlag === 'FF D8';
    }
    // 是否 jpg 文件
    private function isJpgEnd($filename)
    {
        // jpg 文件最后2个字节为 FF D9
        $blob = file_get_contents($filename, NULL, NULL, -2, 2);
        $headFlag = $this->blobToString($blob);
        return $headFlag === 'FF D9';
    }
    // 是否图片文件 gif/png/jpe
    private function isImage($filename)
    {
        return $this->isGif($filename) || $this->isPng($filename) || $this->isJpg($filename);
    }
    /**
    * 成功时的返回
    *
    */
    private function returnSuccess($data = array())
    {
        echo json_encode(array(
          'code' => 0,
          'data' => $data
        ));
        exit;
    }
    /**
    * 成功时返回简单的信息
    *
    */
    private function returnMessage($message = '')
    {
        echo json_encode(array(
          'code' => 0,
          'message' => $message
        ));
        exit;
    }
    /**
    * 失败时的返回
    *
    */
    private function returnError($message = '', $code = -1, $errors = array())
    {
        echo json_encode(array(
          'code' => $code,
          'message' => $message,
          'errors' => $errors
        ));
        exit;
    }
    /**
    * 获取接口传的参数
    * @return array
    */
    private function getParams()
    {
        if ($_POST) {
          return $_POST;
        } else {
          $request = file_get_contents('php://input');
          $params = json_decode($request, true);
          return $params ? $params : array();
        }
    }
}
