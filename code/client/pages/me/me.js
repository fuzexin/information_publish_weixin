var util = require("../../utils/util.js");
Page({
  data: {
    avatar: '',
    name: '',
    issues:[]
  },
  onShow: function () {
    this.setData({
      // avatar: wx.getStorageSync('avatar') ,
      // name: wx.getStorageSync('name')
      avatar:getApp().globalData.avatar,
      name:getApp().globalData.name
    });
  },
  onLoad:function(){
    var that = this;
    getApp().request({
      url:"/issues2/me",
      method:"get",
      success:function(res){
        var my_issues = res.data;
        my_issues.forEach(function(item){
          item.publish_time = util.formatTime(item.publish_time);
        });
        that.setData({ 
          issues: my_issues,
        });
      }
    });

  },
  goto_detail(event ){
    var issue_id = event.currentTarget.dataset.issue_id;
    if (issue_id==""){
      wx.showToast({
        title: '系统出错！',
        icon:"none",
        duration:1000
      });
      return;
    }
    getApp().globalData._issue_id = issue_id;
    wx.navigateTo({
      url: '/pages/details/details',
    });
  },
  
  onPullDownRefresh: function () {
    //上拉刷新函数
    //wx.startPullDownRefresh();
    wx.showNavigationBarLoading();
    this.onLoad();
    wx.stopPullDownRefresh();
    wx.showToast({
      title: '刷新成功！',
      icon: "success",
      duration: 2000
    });
    wx.hideNavigationBarLoading();
  },

})