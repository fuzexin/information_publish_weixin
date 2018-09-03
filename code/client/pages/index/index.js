var util = require("../.././utils/util");
Page({
  data: { //内容数据
    inputShowed: false, //搜索框控制参数
    inputVal: "", //搜索内容
    is_searched_issues:false,
    icon_top: "/../images/top.png", //置顶图标
    top_issues: [], //id，标题，时间
    normal_issues: [] //id，标题，时间
  },

  onShow() {
    if (getApp().globalData._need_refresh==1){
      getApp().globalData._need_refresh = 0;
      this.getDataLoad(0);
      wx.showToast({
        title: '操作成功！',
        icon: "success",
        duration: 1000
      });
    }
  }, //test

  onLoad() { //加载时执行的内容
    var that = this;
    //加载前，首先进行登陆检测
    getApp().checkLogin(function() {
      that.getDataLoad(0);
    });
  },
  //加载函数
  //
  //////////
  getDataLoad(last_issue_id) {
    var that = this;
    //console.log("getDataLoad");//test
    getApp().request({
      url: '/issues/' + last_issue_id,
      method: "get",
      success: function(res) {
        if (res.statusCode !== 200) {
          wx.showToast({
            icon: 'none',
            title: '请求出错'
          });
          return;
        }
        var issues = res.data;
        //console.log(issues);//test
        if (last_issue_id == 0) {
          that.data.top_issues = [].concat(JSON.parse(JSON.stringify(issues.result1)));
          that.data.normal_issues = [].concat(JSON.parse(JSON.stringify(issues.result2)));
          that.data.top_issues.forEach(function (item) {
            item["publish_time"] = util.formatTime(item["publish_time"]);
          });
        } else {
          that.data.normal_issues = that.data.normal_issues.concat(JSON.parse(JSON.stringify(issues.result2)));
        }
        that.data.normal_issues.forEach(function (item) {
          item["publish_time"] = util.formatTime(item["publish_time"]);
        });
        var top_issues = that.data.top_issues;
        var normal_issues = that.data.normal_issues;
        that.setData({
          top_issues: top_issues,
          normal_issues: normal_issues
        });

      }
    });
  },

  //搜索框执行函数
  //
  //////////////
  showInput: function() { //当点击搜索框输入时调用
    this.setData({
      inputShowed: true
    });
  },

  hideInput: function() { //取消搜索时调用
    this.setData({
      inputVal: "",
      inputShowed: false
    });
  },

  clearInput: function() { //清空搜索内容
    this.setData({
      inputVal: ""
    });
  },

  inputTyping: function(e) { //将输入框中的内容实时闯入inputVal参数中
    this.setData({
      inputVal: e.detail.value
    });
  },
  //
  //
  ////////////

  //转向函数
  //
  ////////
  goto_publish() {
    wx.navigateTo({
      url: "/pages/publish/publish",
    })
  },

  goto_details(event) {
    //console.log(event.currentTarget.dataset.issueId);
    getApp().globalData._issue_id = event.currentTarget.dataset.issueId;
    wx.navigateTo({
      url: '/pages/details/details',
    });
  },
  //
  //
  ////////////////
  onPullDownRefresh: function() {
    //上拉刷新函数
    //wx.startPullDownRefresh();
    wx.showNavigationBarLoading();
    this.getDataLoad(0);
    this.data.is_searched_issues=false;
    wx.stopPullDownRefresh();
    wx.showToast({
      title: '刷新成功！',
      icon: "success",
      duration:2000
    });
    wx.hideNavigationBarLoading();
  },

  onReachBottom: function() {
    //下拉加载函数
    if (!this.data.normal_issues){
      return;
    }
    var normal_issues_end_id = this.data.normal_issues[this.data.normal_issues.length-1].issue_id;
    //console.log(normal_issues_end_id);//test
    if (normal_issues_end_id == 1 || this.data.is_searched_issues){
      wx.showToast({
        title: '没有更多内容了!',
        icon:"none",
        duration:1000
      });
      return ;
    }
    this.getDataLoad(normal_issues_end_id);
  },
  //搜索内容
  searchTopic(){
    var search_key = this.data.inputVal.trim();
    if (search_key==""){
      wx.showToast({
        title: '请输入搜索关键词！',
        icon:"none",
        duration:1000,
      });
      return;
    }
    var that= this;
    getApp().request({
      url:"/issues2/search",
      method:"get",
      data:{
        search_key: search_key,
      } ,
      success:function(res){
        var matched_issue =res.data;
        //console.log(matched_issue);
        matched_issue.forEach(function(item){
          item.publish_time = util.formatTime(item.publish_time);
        });
        that.setData({
          top_issues:[],
          normal_issues: matched_issue,
          is_searched_issues:true,
          inputVal:""
        });
      }
    });
    
  }

})