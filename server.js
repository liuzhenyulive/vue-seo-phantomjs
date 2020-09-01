// server.js
// ExpressJS调用方式
var express = require('express');
var redis = require('redis');
var expire_time = 60 * 60;
var host="localhost";
var port=6079;
var password="123456";
var client = redis.createClient(port, host, { auth_pass: password });
// var phantomjs = require('phantom');
var app = express();
var path = process.cwd();
// 引入NodeJS的子进程模块
var child_process = require('child_process');
app.get('*', function (req, res) {
    // 部署到服务器的完整URL
    //var url = req.protocol + '://'+ req.hostname + req.originalUrl;
    //console.log(url);

    // 测试的url
    var url = 'http://localhost:80' + req.originalUrl.replace('/spider', '');
    var key = "phantom-" + url


    // 预渲染后的页面字符串容器
    var content = '';
    client.get(key, function (err, reply) {
        if (!reply) {
            // 开启一个phantomjs子进程
            var phantom = child_process.spawn('phantomjs', [path + '/spider.js', url]);
            // 设置stdout字符编码
            //phantom.stdout.setEncoding('utf8');
            // 监听phantomjs的stdout，并拼接起来
            phantom.stdout.on('data', function (data) {
                content += data.toString();
            });
            // 监听子进程退出事件
            phantom.on('exit', function (code) {
                console.log("content是：")
                console.log(content)
                switch (code) {
                    case 1:
                        console.log('加载失败');
                        res.send('加载失败');
                        break;
                    case 2:
                        console.log('加载超时: ' + url);
                        res.send(content);
                        break;
                    default:
                        console.log('加载页面: ' + url);
                        client.set(key, content);
                        client.expire(key, expire_time);
                        res.send(content);
                        break;
                }
            });
        } else {
            res.send(reply);
        }
    });
});
app.listen(8081, function () {
    console.log('Spider app listening on port 8081!');
    console.log(path + '/spider.js')
});
