<?php

namespace Admin\Controller;

use Think\Controller;
use Common\Util\FleaUpload;

/**
 * 文件上传制器
 */
class UploadController extends Controller
{
  public function _initialize()
  {
    $this->uploadDir = WEB_ROOT . '/Upload';
  }
  // 文件检查
  public function checkfile()
  {
    // 获取接口传的参数
    $params = $this->getParams();
    $ext = $params['ext'];
    $hash = $params['hash'];
    
    $filePath = $hash ? $this->uploadDir . "/$hash.$ext" : '';
    $chunkdDir = $this->uploadDir . "/$hash";
    
    $uploaded = false;
    $uploadedList = [];
    if (file_exists($filePath)) {
      // 文件存在
      $uploaded = true;
    } else {
      $uploadedList = $this->getUploadedList($chunkdDir);
    }
    /* http_response_code(500);
    headers_sent(); */
    $this->returnSuccess([
      'uploaded' => $uploaded,
      'uploadedList' => $uploadedList,
    ]);
  }
  // 文件上传
  public function uploadfile()
  {
    $name = I('post.name');
    $hash = I('post.hash');
    // 模拟报错
    if(random_int(0, 10) > 2){
      http_response_code(500);
      headers_sent();
      $this->returnError('error', 500);
    }
    $chunkdDir = $this->uploadDir . "/$hash";
    if (!is_dir($chunkdDir)) {
      mkdir($chunkdDir);
      chmod($chunkdDir, 0777);
    }
    
    $filename = $chunkdDir . '/' . $name;
    move_uploaded_file($_FILES['chunk']['tmp_name'], $filename);
    $this->returnMessage('切片上传成功');
  }
  // 文件合并
  public function mergefile()
  {
    $params = $this->getParams();
    $ext = $params['ext'];
    $hash = $params['hash'];
    $size = $params['size'];
    
    $filePath = $this->uploadDir . "/$hash.$ext";
    $chunkdDir = $this->uploadDir . "/$hash";

    $chunks = $this->getUploadedList($chunkdDir);
    // 文件重新排序
    usort($chunks, function($a, $b){
      return explode('-', $a)[1] - explode('-', $b)[1];
    });
    // 合并操作
    $handle = fopen($filePath, 'w+b');
    foreach ($chunks as $key => $file) {
      $content = file_get_contents($chunkdDir . '/' .$file);
      fwrite($handle, $content);
    }
    fclose($handle);
    $cmd = "/mnt/heidun/apacheroot 'rm -rf $chunkdDir'";
    exec($cmd, $result, $i);
    $this->returnSuccess();
  }
  
  
  // 获取上传的文件
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

  private function returnSuccess($data = [])
  {
    echo json_encode([
      'code' => 0,
      'data' => $data
    ]);
    exit;
  }
  private function returnMessage($message = '')
  {
    echo json_encode([
      'code' => 0,
      'message' => $message
    ]);
    exit;
  }
  private function returnError($message = '', $code = -1, $errors = [])
  {
    echo json_encode([
      'code' => $code,
      'message' => $message,
      'errors' => $errors
    ]);
    exit;
  }
  /**
   * 获取接口传的参数
   * @return array
   */
  private function getParams()
  {
    $request = I('post.');
    if ($request) {
      return $request;
    } else {
      $request = file_get_contents('php://input');
      $params = json_decode($request, true);
      return $params ? $params : array();
    }
  }

}