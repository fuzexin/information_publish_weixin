Page({
  bindGetUserInfo: function () {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          wx.getUserInfo({
            success: function (res1) {
              getApp().globalData.name = res1.userInfo.nickName;
              getApp().globalData.avatar = res1.userInfo.avatarUrl;
            }
          })
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      }
    })
  },
  onLoad: function () {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          if (!getApp().globalData.name || !getApp().globalData.avatar) {
            wx.getUserInfo({
              success: function (res1) {
                getApp().globalData.name = res1.userInfo.nickName;
                getApp().globalData.avatar = res1.userInfo.avatarUrl;
              }
            })
          }
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      }
    })
  }
})