    var formatTime = function (string_time) {
      var date = new Date(string_time);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hour = date.getHours();
      var minute = date.getMinutes();
      // var second = date.getSeconds();
      return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute].map(formatNumber).join(':');
    };

    var formatNumber = function (n) {
      var n = n.toString();
      return n[1] ? n : '0' + n;
    };

    module.exports = {
      formatTime: formatTime
    }
















    // const formatTime = date => {
    //   const year = date.getFullYear()
    //   const month = date.getMonth() + 1
    //   const day = date.getDate()
    //   const hour = date.getHours()
    //   const minute = date.getMinutes()
    //   const second = date.getSeconds()

    //   return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    // }

    // const formatNumber = n => {
    //   n = n.toString()
    //   return n[1] ? n : '0' + n
    // }

    // module.exports = {
    //   formatTime: formatTime
    // }