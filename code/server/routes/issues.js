var fs = require('fs');
var express = require('express');
var multiparty = require('multiparty');
var CosSdk = require('cos-nodejs-sdk-v5');
var router = express.Router();
var loginCheckMiddleware = require('../util').loginCheckMiddleware;
var config = require('../config');
var moment = require('moment');
var mysql = require('../util').mysql;
var issuesTable = 'issue';
var qcloudConfig = JSON.parse(fs.readFileSync('/data/release/sdk.config.json', 'utf8'));

// 文件存储sdk初始化
var cos = new CosSdk({
  AppId: qcloudConfig.qcloudAppId,
  SecretId: qcloudConfig.qcloudSecretId,
  SecretKey: qcloudConfig.qcloudSecretKey
});

//用户信息核对
router.use(loginCheckMiddleware);

//↓检查是否为登录状态
router.all('*', function(req, res, next) {
  if (!req.session) {
    res.status(401).json({
      error: '未登录'
    });
    return;
  }
  next();
});

//图片上传
router.post('/images', function(req, res, next) {

  // 用于解析文件上传
  var form = new multiparty.Form({
    encoding: 'utf8',
    autoFiles: true,
    uploadDir: '/tmp'
  }); //↑设置解析格式

  //↓解析
  form.parse(req, function(err, fields, files) {

    if (err) {
      next(err);
    } //↑报错
    else {
      var upload_imageFile = files.upload_image[0];
      var fileExtension = upload_imageFile.path.split('.').pop(); //←取出文件名，去掉后缀
      var fileKey = parseInt(Math.random() * 10000000) + '_' + (+new Date) + '.' + fileExtension; //↑随机生成存储图片文件名

      var params = {
        Bucket: config.cos.fileBucket,
        Region: config.cos.region,
        Key: fileKey,
        Body: fs.readFileSync(upload_imageFile.path),
        ContentLength: upload_imageFile.size
      };

      cos.putObject(params, function(err, data) {
        // 删除临时文件
        fs.unlink(upload_imageFile.path); //该地址是客户端需要上传的图片的地址。
        if (err) {
          next(err);
          return;
        }
        res.end(data.Location);
      });
    }
  });
});

//删除已上传图片
router.delete('/images/:preDeleteUrl', function(req, res, next) {
  var preDeleteUrl = req.params.preDeleteUrl;
  var params = {
    Bucket: config.cos.fileBucket,
    Region: config.cos.region,
    Key: preDeleteUrl,
  };
  cos.deleteObject(params, function(err, data) {
    if (err) {
      res.status(500).json({
        error: '服务器删除过程出错！'
      });
    } else {
      res.status(204).json({});
    }
  });
});

//存入issue实体
router.post('/', function(req, res, next) {
  var issue = req.body;
  if (!issue.topic) {
    res.status(400).json({
      error: '参数错误'
    });
    return;
  };
  var curTime = moment().format('YYYY-MM-DD HH:mm:ss');
  issue = {
    open_id: req.session.open_id,
    topic: issue.topic,
    detail_text: issue.detail || "",
    images: issue.images || "",
    publish_time: curTime
  };

  mysql(issuesTable).insert(issue)
    .then(function(result) {
      issue.id = result[0];
      //↑因为id为自增长类型，所以需要从数据库中返回
      delete issue.open_id;
      //res.json(issue);
      res.end();
    });
});

//获取信息列表
router.get('/:last_issue_id', function(req, res, next) {
  var last_issue_id = req.params.last_issue_id;
  if (last_issue_id==0){
    mysql(issuesTable).select("issue_id", "topic", "publish_time").where("is_top", 1).orderBy("issue_id", "DESC").then(function (result1){
      mysql.select("issue_id", "topic", "publish_time").from(issuesTable).where("is_top", 0).andWhere("issue_id", "<=", mysql("issue").max("issue_id")).orderBy("issue_id", "DESC").limit(30).then(function (result2) {
        //console.log(result);//test

        res.json({
          result1,
          result2
        });

      });
    });
  } else{
    mysql.select("issue_id", "topic", "publish_time").from(issuesTable).where("is_top", 0).andWhere("issue_id", "<", last_issue_id).orderBy("issue_id", "DESC").limit(30).then(function (result2) {

      res.json({
        result2,
      });
    });
  }
});

//获取某条信息详情
router.get("/detail/:issue_id", function(req, res, next) {
  var issue_id = req.params.issue_id;
  //
  mysql(issuesTable).select("user.name", "user.avatar","user.role","issue.open_id", "topic", "detail_text", "images", "publish_time","is_top").leftOuterJoin("user", "issue.open_id", "user.open_id").where("issue_id", issue_id).then(function(issue) {
    var selected_issue = issue[0];
    if (req.session.open_id == selected_issue.open_id){
      selected_issue["belongto"]=1;
    }else{
      selected_issue["belongto"] = 0;
    };
    delete selected_issue.open_id;
    mysql("comment").select("user.name", "user.avatar","user.role", "comment.open_id","comment_id","comment_text", "date").leftOuterJoin("user", "comment.open_id", "user.open_id").where("issue_id", issue_id).then(function(selected_comment) {
      var selected_comment = selected_comment;
      if (selected_comment.length!=0){
        selected_comment.forEach(function(item){
          if (req.session.open_id == item["open_id"]){
            item["belongto"] = 1;
          }else{
            item["belongto"] = 0;
          }
          delete item.open_id;
        });
      }
      res.json({
        selected_issue,
        selected_comment
      });
    });
  });
});

//发表评论
router.post('/comment', function(req, res, next) {
  var data = req.body;
  if (!data.issue_id) {
    res.status(400).json({
      error: '参数错误'
    });
    return;
  };
  var curTime = moment().format('YYYY-MM-DD HH:mm:ss');
  comment = {
    open_id: req.session.open_id,
    issue_id: data.issue_id,
    comment_text: data.comment || "",
    date: curTime
  };

  mysql("comment").insert(comment)
    .then(function(result) {
      //↑因为id为自增长类型，所以需要从数据库中返回
      delete comment.open_id;
      //res.json(comment);
      res.end();
    });
});

module.exports = router;