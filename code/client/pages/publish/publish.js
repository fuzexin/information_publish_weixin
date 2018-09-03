// pages/publish/publish.js
var config = require('../../config');
Page({
  //页面数据
  data: {
    topic: "",
    detail_text: "",
    images: [],
    topic_NO_counter: 0,
    detail_NO_counter: 0,
  },
  topicTyping: function(event) {
    this.setData({
      topic: event.detail.value,
      topic_NO_counter: this.data.topic.length
    });
  },
  detailTyping: function(event) {
    this.setData({
      detail_text: event.detail.value,
      detail_NO_counter: this.data.detail_text.length
    });
  },
  previewImage(event) {
    var that = this;
    wx.previewImage({
      current: that.data.images[event.currentTarget.dataset.id],
      urls: that.data.images
    })
  },
  //上传图片
  doUpload: function(e) {
    if(this.data.images.length>=4){
      wx.showToast({
        title: '抱歉，每条信息暂时最多支持上传4张图片！',
        icon:"none",
        duration:2000
      });
      return;
    }
    var that = this;
    wx.chooseImage({
      sizeType: "compressed",
      success: function(res) {
        var size = res.tempFiles[0].size;
        if (size >= 1048576) {
          wx.showToast({
            title: '现仅支持上传文件小于1M的图片！',
            mask: true,
            icon: "none",
            duration: 1800
          })
          return;
        }
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        wx.uploadFile({
          header: {
            skey: wx.getStorageSync('skey')
          },
          url: config.host + '/issues/images',
          filePath: res.tempFilePaths[0],
          name: 'upload_image',
          success: function(res) {
            wx.hideLoading();
            var images = that.data.images;
            images.push(res.data);
            that.setData({
              images: images
            });

          }
        });

      }
    });
  },

  //发布新的消息
  publishTo() {
    if(getApp().globalData.userInfo.role==2){
      wx.showToast({
        title: '您已被禁言',
        icon:"none",
        duration:1000
      })
      return;
    }
    //获取数据
    var that = this;
    var send_data = {
      topic: this.data.topic,
      detail: this.data.detail_text
    };
    if(this.data.images.length==0){
      send_data["images"]="";
    }else{
      send_data["images"]=this.data.images.toString();
    }

    if (send_data["topic"].trim().length == 0) {
      wx.showToast({
        title: '请填写标题内容~',
        icon: 'none'
      });
      return;
    }
    wx.showLoading({
      title: '正在创建发布...',
      mask: true
    });
    getApp().request({
      url: '/issues',
      method: 'POST',
      data: send_data,
      success: function() {
        wx.hideLoading();
        wx.showToast({
          title: '发布成功！',
          icon:"none",
          duration:1000,
          mask:true,
          success:function(){
            wx.navigateBack();
            getApp().globalData._need_refresh=1;
          }
        }) 
      }
    });
  },

  //删除已上传图片
  deleteUpload(event) {
    //防止误删，需用户确认
    var preDeleteId = event.currentTarget.dataset.id;
    var preDeleteUrl = this.data.images[preDeleteId];
    preDeleteUrl = preDeleteUrl.split("/").pop();
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确定删除此图片？',
      success: function(res) {
        if (res.cancel) {
          return;
        } else if (res.confirm) {
          getApp().request({
            url: '/issues/images/' + preDeleteUrl,
            method: 'delete',
            success: function(res) {
              if (res.statusCode !== 204) {
                wx.showToast({
                  icon: 'none',
                  title: '请求错误',
                });
                return;
              }
              that.data.images.splice(preDeleteId, 1);
              if (that.data.images.length == 0) {
                that.setData({
                  images: []
                });
              } else {
                that.setData({
                  images: this.data.images
                });
              }
              wx.showToast({
                title: '图片删除成功！',
                icon: 'none',
              })
            }
          });
        }
      }
    });
  },
  
})