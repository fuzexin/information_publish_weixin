//配置文件
module.exports = {
  port: 5757,
  //过期时间，秒
  expireTime: 24 * 3600,
  appid: 'wx92cbfa7864988372',
  secret: '98296b2af866d2d74d6d7a73d25dbd4f',
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    db: 'campus_cloud',
    pass: 'qwert123',
    char: 'utf8mb4'
  },
  //文件云存储
  cos: {
    region: 'ap-chengdu',
    fileBucket: 'campus-cloud-1256879268'
  }
};