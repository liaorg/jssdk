<?php

define("PC", 3); // 进程个数
define("TO", 4); // 超时
define("TS", 5); // 事件跨度，用于模拟任务延时

$ppid = getmypid();
echo '父进程：'.$ppid."\n";
/* $pid = pcntl_fork();
if ($pid == -1) {
    throw new Exception('fork子进程失败!');
} elseif ($pid > 0) {
    cli_set_process_title("我是父进程,我的进程id是{$ppid}.");
    sleep(30); // 保持30秒，确保能被ps查到
} else {
    $cpid = getmypid();
    cli_set_process_title("我是{$ppid}的子进程,我的进程id是{$cpid}.");
    sleep(30);
    exit(0); // 执行完后退出
} */

echo "模拟任务并发\n";
// 模拟任务并发
for ($i = 0; $i < PC; ++$i ) {
    $nPID = pcntl_fork(); // 创建子进程
    // echo "$nPID\n";
    if ($nPID == -1) {
        //错误处理：创建子进程失败时返回-1.
        die('could not fork');
    } elseif($nPID == 0) {
        $cpid = getmypid();
        cli_set_process_title("我是{$ppid}的子进程,我的进程id是{$cpid}.");
        echo '创建子进程：'.$cpid."\n";
        $sleeptime = rand(1, TS);
        echo "子任务处理中...\n";
        // 子进程过程
        sleep($sleeptime); // 模拟延时
        echo "子任务 $cpid 花了 $sleeptime 秒\n";
        exit(0); // 执行完后退出
    }
}

// 父进程会得到子进程号，所以这里是父进程执行的逻辑
cli_set_process_title("我是父进程,我的进程id是{$ppid}.");
// 如果不需要阻塞进程，而又想得到子进程的退出状态，则可以注释掉pcntl_wait($nStatus)语句，或写成：
// pcntl_wait(-1, WNOHANG)
// 等待子进程执行完毕，避免僵尸进程
$n = 0;
$t = 0;
while ($n < PC) {
    $t++;
    $nStatus = -1;
    $nPID = pcntl_wait($nStatus, WNOHANG);
    if ($nPID > 0) {
        echo "{$nPID} exit $t\n";
        $t = 0;
        ++$n;
    }
}
echo "处理完了\n";


