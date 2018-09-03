var util = require("../.././utils/util");
Page({
  data: {
    inputShowed: false, //
    inputVal: "", //
    issue: {},
    comment: [],
    images: [],
    isAdmin:false,
    isSuperAdmin:false,
  },

  //加载详情
  onLoad() {
    if (getApp().globalData.userInfo.role == 1 || getApp().globalData.userInfo.role == 3){
      this.setData({
        isAdmin:true,
      });
      if (getApp().globalData.userInfo.role == 3){
        this.setData({
          isSuperAdmin: true,
        });
      }
    };
    var issue_id = getApp().globalData._issue_id;
    var that = this;
    getApp().request({
      url: '/issues/detail/' + issue_id,
      method: "get",
      success: function(res) {
        if (res.statusCode !== 200) {
          wx.showToast({
            icon: 'none',
            title: '请求出错'
          });
          return;
        }
        var data = res.data;
        that.data.issue = res.data.selected_issue;
        that.data.comment = res.data.selected_comment;
        if (that.data.issue["images"] != null) {
          that.data.images = that.data.issue["images"].split(",");
        }
        var issue = that.data.issue;
        var comment = that.data.comment || [];
        var images = that.data.images;
        issue.publish_time = util.formatTime(issue.publish_time);
        comment.forEach(function(item) {
          item.date = util.formatTime(item.date);
        });
        that.setData({
          issue: issue,
          images: images,
          comment: comment,
        });
      }
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

  //发布评论
  publish_comment() {
    if (getApp().globalData.userInfo.role == 2) {
      wx.showToast({
        title: '您已被禁言',
        icon: "none",
        duration: 1000
      })
      return;
    }
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认评论？',
      success:function(res){
        if(res.cancel){
          return;
        }else if(res.confirm){
          //
          var comment = that.data.inputVal;
          if (comment == "") {
            wx.showToast({
              title: '请输入您想发送的内容！',
              icon: "none",
              duration: 1000
            });
            return;
          }
          //封装数据
          var send_data = {
            issue_id: getApp().globalData._issue_id,
            comment: comment,
          };
          //console.log(getApp().globalData._issue_id);
          getApp().request({
            url: '/issues/comment',
            method: 'POST',
            data: send_data,
            success: function () {
              wx.showToast({
                title: '发布成功！',
                icon: "none",
                duration: 1000,
                mask: true,
              });
              that.onLoad();
              that.setData({
                inputVal:"",
              });
              // console.log(that.data.comment);
            }
          });
        }
      }
    });
   
  },

  //预览图片
  preview_image(event) {
    var that = this;
    wx.previewImage({
      current: that.data.images[event.currentTarget.dataset.image_index],
      urls: that.data.images
    })
  },

  //置顶 与 取消顶置
  set_top() {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认进行此操作？',
      success: function(res){
        if(res.cancel){
          return;
        }else if(res.confirm){
          //
          var issue_id = getApp().globalData._issue_id;
          var is_top = that.data.issue.is_top;
          var set_value = 1 - is_top;
          getApp().request({
            url: "/issues2/set_top",
            method: "get",
            data: {
              issue_id: issue_id,
              set_value: set_value,
            },
            success: function (res) {
              getApp().globalData._need_refresh = 1;
              wx.navigateBack();
            }
          });
        }
      }
    });
  },


  //删除特定的issue
  delete_issue() {
    wx.showModal({
      title: '提示',
      content: '确认删除该条信息？',
      success:function(res){
        if(res.cancel){
          return;
        }else if(res.confirm){
          //
          var delete_issue_id = getApp().globalData._issue_id;
          if (delete_issue_id == "") {
            wx.showToast({
              title: '系统错误！loc:delete_issue',
              icon: "none",
              duration: 1000
            })
            return;
          }
          getApp().request({
            url: "/issues2/delete_issue",
            method: "get",
            data: {
              delete_issue_id: delete_issue_id,
            },
            success: function (res) {
              wx.navigateBack();
              getApp().globalData._need_refresh = 1;
            }
          });
        }
      }
    });
  },

  //删除某条评论
  delete_comment(event) {
    wx.showModal({
      title: '提示',
      content: '确认删除该条评论？',
      success: function(res) {
        if (res.cancel) {
          return;
        } else if (res.confirm) {
          //
          var delete_comment_id = event.currentTarget.dataset.comment_id;
          if (delete_comment_id == "") {
            wx.showToast({
              title: '系统错误！ loc: details-244 ',
              icon: "none",
              duration: 1000
            });
            return;
          };
          getApp().request({
            url: "/issues2/delete_comment",
            method: "get",
            data: {
              delete_comment_id: delete_comment_id,
            },
            success: function(res) {
              that.onLoad();
              wx.showToast({
                title: '删除成功!',
                icon:"success",
                duration:1000
              });
            }
          });

        }

      }
    });
  },
  //设置信息发布者为管理员
  set_administrator(){
    var issue_id =  getApp().globalData._issue_id;
    var that = this;
    if(issue_id==""){
      wx.showToast({
        title: '参数错误！loc:details272',
        icon:"none",
        duration:1000
      });
      return;
    };
    wx.showModal({
      title: '提示',
      content: "是否确认该操作？",
      success:function(res){
        if(res.cancel){
          return;
        }else if(res.confirm){
          getApp().request({
            url:"/issues2/publisher/set_admin",
            method:"get",
            data:{
              issue_id:issue_id,
            },
            success:function(res){
              that.onLoad();
              wx.showToast({
                title: '操作成功！',
                icon:"none",
                duration:1000
              });
            },
          });
        }
      }
    })
  },
  ban_publish(){
    var issue_id = getApp().globalData._issue_id;
    var that = this;
    if (issue_id == "") {
      wx.showToast({
        title: '参数错误！loc:details272',
        icon: "none",
        duration: 1000
      });
      return;
    };
    wx.showModal({
      title: '提示',
      content: "是否确认该操作？",
      success: function (res) {
        if (res.cancel) {
          return;
        } else if (res.confirm) {
          getApp().request({
            url: "/issues2/publisher/ban_publish",
            method: "get",
            data: {
              issue_id: issue_id,
            },
            success: function (res) {
              that.onLoad();
              wx.showToast({
                title: '操作成功！',
                icon: "none",
                duration: 1000
              });
            },
          });
        }
      }
    })
  },
  //设置或者取消评论者为管理员
  set_comment_admin(event){
    var comment_id = event.currentTarget.dataset.comment_id;
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认此操作？',
      success:function(res){
        if(res.cancel){
          return;
        }else if(res.confirm){
          getApp().request({
            url: "/issues2/comment/set_admin",
            method: 'get',
            data: {
              comment_id: comment_id,
            },
            success: function (res) {
              that.onLoad();
              wx.showToast({
                title: '操作成功！',
                icon: "none",
                duration: 1000
              })
            }
          });
        }
      }
    })
  },

  //禁言或者取消评论者
  ban_comment_pub(event) {
    var comment_id = event.currentTarget.dataset.comment_id;
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认此操作？',
      success: function (res) {
        if (res.cancel) {
          return;
        } else if (res.confirm) {
          getApp().request({
            url: "/issues2/comment/ban_user",
            method: 'get',
            data: {
              comment_id: comment_id,
            },
            success: function (res) {
              that.onLoad();
              wx.showToast({
                title: '操作成功！',
                icon: "none",
                duration: 1000
              })
            }
          });
        }
      }
    })
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