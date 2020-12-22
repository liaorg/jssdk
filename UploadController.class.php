<?php

namespace Admin\Controller;

use Think\Controller;
use Common\Util\Upload;


/**
 * 文件上传制器
 */
class UploadController extends Controller
{
    public function _initialize()
    {
        $config = array(
            'webRoot' => WEB_ROOT,
            // 上传文件类型限制，默认支持：zip encryZip image(gif/png/jpe) png jpe gif
            'typeLimit' => 'flv',
        );
        $this->upload = new Upload($config);
    }
    // 文件检查
    public function checkfile()
    {
        $result = $this->upload->checkfile();
        $this->returnSuccess($result['data']);
    }
    // 分片文件上传
    public function uploadfile()
    {
        $result = $this->upload->uploadfile();
        if ($result['status']) {
            /* if ($result['data']['checkType']) {
                // 用户自定义文件类型判断
                $opts = $this->upload->getOpts();
                $file = $opts['chunkDir'] . $opts['file']['hash'].'/'.$opts['file']['hash'].'-0';
                $blob = file_get_contents($file, NULL, NULL, 0, 100);
                $headFlag = $this->upload->blobToString($blob);
                if (!strpos($headFlag, '75 70 64 61 74 65 2E 74 67 7A')) {
                    // 不是正确的升级包
                    // 删除上传的文件
                    $this->upload->rmFile(dirname($file));
                    $msg = array(
                        'errmsg' => 'custom filetype error',
                    );
                    $this->returnServerError(412, $msg);
                }
            } */
            $this->returnSuccess($result['data']);
        } else {
            $this->returnServerError($result['code'], $result['data']);
        }
    }
    // 分片文件合并
    public function mergefile()
    {
        $result = $this->upload->mergefile();
        if ($result['status']) {
            $this->returnSuccess($result['data']);
        } else {
            $this->returnServerError($result['code'], $result['data']);
        }
    }
    /**
    * 成功时的返回
    *
    */
    private function returnSuccess($data = [])
    {
        echo json_encode([
          'code' => 0,
          'data' => $data
        ]);
        exit;
    }
    /**
    * 成功时返回简单的信息
    *
    */
    private function returnMessage($message = '')
    {
        echo json_encode([
          'code' => 0,
          'message' => $message
        ]);
        exit;
    }
    /**
    * 失败时的返回
    *
    */
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
    * 失败时的返回
    *
    */
    private function returnServerError($code, $data = [])
    {
        http_response_code($code);
        headers_sent();
        $this->returnError($data['errmsg'], $code);
        exit;
    }
}