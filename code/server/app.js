var bodyParser = require('body-parser');
var express = require('express');
var config = require('./config');
var login = require('./routes/login');
var user = require('./routes/user');
var issues =require('./routes/issues');
var issues2 =require('./routes/issues2');
var app = express();
var port = config.port;

app.use(bodyParser.json());//parser:解析器

app.use('/login', login);

app.use('/user', user);

app.use('/issues',issues);

app.use('/issues2',issues2);

//↓如果服务器状态码为404时，返回资源未找到
app.use(function (req, res, next) {

  res.status(404).json({
    error: '资源未找到'
  });

});

app.use(function (error, req, res, next) {

  console.log(error);
  res.status(500).json({
    error: '服务器内部错误'
  });

});

//↓设置服务器监听端口为config配置文件中的5757

app.listen(port, function (error) {
  if (error) {
    console.log('error!');
  }
  else {
    console.log("Server start! Listening on localhost:" + port);
  }
});