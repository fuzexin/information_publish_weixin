var moment = require('moment');//时间相关部件
var config = require('./config');//导入配置文件config.js
var sessionTable = 'session';
//session表，为腾讯服务器向小程序服务器返回的会话所需信息，
//包含open_id,skey,create_time,last_login_time, session_key。

//↓获取mysql 连接
var mysql = require('knex')({
  client: 'mysql',
  connection: {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.pass,
    database: config.mysql.db,
    charset: config.mysql.char
  }
});

//↓登录中间件，每次登陆都需要调用
var loginCheckMiddleware = function (req, res, next) {

  var skey = req.headers.skey;
  req.session = null;//session置为空
  //↓没有skey，说明是第一次登录
  if (!skey) {
    next();
    return;
  }
  //↓，登陆的时候有skey凭证
  mysql(sessionTable).select('*').where({
    skey: skey
  })
    .then(function (result) {
      if (result.length > 0) {
        var session = result[0];//result[0]是一条完整session信息
        var lastLoginTime = session.last_login_time;
        var expireTime = config.expireTime * 1000;//计算过期截至时间

        if (moment(lastLoginTime, 'YYYY-MM-DD HH:mm:ss').valueOf() + expireTime > +new Date) {
          req.session = session;
        }
      }
      next();
    })
    .catch(function (e) {
      next();
    });

};
//↑ 经过loginCheckMiddleware后，
//如果用户携带skey以及skey未过期，通过登陆检验request中携带session信息，
//不然session信息已被置空。

function only(obj, keys) {
  obj = obj || {};
  if ('string' == typeof keys) keys = keys.split(/ +/);
  return keys.reduce(function (ret, key) {
    if (null == obj[key]) return ret;
    ret[key] = obj[key];
    return ret;
  }, {});
};
//功能性函数，返回obj中只在keys关键词中的属性。

module.exports = {
  mysql: mysql,
  loginCheckMiddleware: loginCheckMiddleware,
  only
};