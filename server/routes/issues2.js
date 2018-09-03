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


//获取个人发表的信息
router.get("/me", function(req, res, next) {
  var open_id = req.session.open_id;
  mysql.select("issue_id", "topic", "publish_time").from(issuesTable).where("open_id", open_id).orderBy("issue_id", "DESC").then(
    function(my_issues) {
      res.send(my_issues);
    });
});

router.get("/search", function(req, res, next) {
  var search_key = "%" + req.query.search_key + "%";

  mysql.select("issue_id", "topic", "publish_time").from(issuesTable).where("topic", "like", search_key).orderBy("issue_id", "DESC").then(
    function(matched_issues) {
      res.send(matched_issues);
    });
});

//置顶 与 取消置顶
router.get("/set_top", function(req, res, next) {
  var issue_id = req.query.issue_id;
  var set_value = req.query.set_value;
  mysql(issuesTable).update("is_top", set_value).where("issue_id", issue_id).then(function(result) {
    res.end();
  });
});

//删除某条信息， 连带删除评论  还有图片

router.get("/delete_issue", function (req, res, next) {
  var delete_issue_id = req.query.delete_issue_id;
  mysql(issuesTable).select("images").where("issue_id", delete_issue_id).then(function(result){
    var images = result[0].images||"";
    if(images){
      var images_array = images.split(",");
      images_array.forEach(function(item){
        var del_key = item.split('/').pop();
        var preDeleteUrl = del_key;
        var params = {
          Bucket: config.cos.fileBucket,
          Region: config.cos.region,
          Key: preDeleteUrl,
        };
        cos.deleteObject(params, function (err, data) {
          if (err) {
            res.status(500).json({
              error: '服务器删除过程出错！'
            });
          } 
        });
      });
    }
  });
  mysql(issuesTable).del().where("issue_id", delete_issue_id).then(
    function(result){
      mysql("comment").del().where("issue_id", delete_issue_id).then(
        function(result2){
          res.send();
        }
      );
    }
  );
});

//删除某条评论
router.get("/delete_comment", function (req, res, next) {
  var delete_comment_id = req.query.delete_comment_id;
  mysql("comment").del().where("comment_id", delete_comment_id).then(
    function(result){
      res.end();
    }
  );
});


//设置信息发布者为管理员
router.get("/publisher/set_admin", function (req, res, next) {
  var issue_id = req.query.issue_id;
  mysql(issuesTable).select("open_id").where("issue_id",issue_id ).then(
    function (result1) {
      var open_id = result1[0].open_id;
      mysql.select("role").from("user").where("open_id",open_id).then(function(result2){
        if(result2[0].role==1){
          mysql("user").update("role", 0).where("open_id",open_id).then(function(result3){
            res.end();
          });
        }else if(result2[0].role==0){
          mysql("user").update("role", 1).where("open_id",open_id).then(function(result4){
            res.end();
          });
        }
      });
    }
  );
});


//禁言信息发布者
router.get("/publisher/ban_publish", function (req, res, next) {
  var issue_id = req.query.issue_id;
  mysql(issuesTable).select("open_id").where("issue_id", issue_id).then(
    function (result1) {
      var open_id = result1[0].open_id;
      mysql("user").select("role").where("open_id",open_id).then(function(result2){
        if(result2[0].role==2){
          mysql("user").update("role", 0).where("open_id", open_id).then(function (reuslt3) {
            res.end();
          });
        } else if (result2[0].role == 0){
          mysql("user").update("role", 2).where("open_id", open_id).then(function (reuslt4) {
            res.end();
          });
        }
      });
    }
  );
});

//设置评论者为管理员或者取消其管理员身份
router.get("/comment/set_admin", function (req, res, next) {
  var comment_id = req.query.comment_id;
  mysql("comment").select("open_id").where("comment_id", comment_id).then(
    function (result1) {
      var open_id = result1[0].open_id;
      mysql("user").select("role").where("open_id", open_id).then(function (result2) {
        if (result2[0].role == 0) {
          mysql("user").update("role", 1).where("open_id", open_id).then(function (reuslt3) {
            res.end();
          });
        } else if (result2[0].role == 1) {
          mysql("user").update("role", 0).where("open_id", open_id).then(function (reuslt4) {
            res.end();
          });
        }
      });
    }
  );
});


//禁言或者取消评论者
router.get("/comment/ban_user", function (req, res, next) {
  var comment_id = req.query.comment_id;
  mysql("comment").select("open_id").where("comment_id", comment_id).then(
    function (result1) {
      var open_id = result1[0].open_id;
      mysql("user").select("role").where("open_id", open_id).then(function (result2) {
        if (result2[0].role == 0) {
          mysql("user").update("role", 2).where("open_id", open_id).then(function (reuslt3) {
            res.end();
          });
        } else if (result2[0].role == 2) {
          mysql("user").update("role", 0).where("open_id", open_id).then(function (reuslt4) {
            res.end();
          });
        }
      });
    }
  );
});








module.exports = router;