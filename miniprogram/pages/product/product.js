// pages/detail/detail.js
const db = wx.cloud.database();
const util = require('../util.js');
const _ = db.command;

Page({
  data: {
    array: [],
    isCollected: false,  // 使用一个布尔值来管理收藏状态
    id: '',
    openid: '',
    pinglun_value: ''
  },

  // 获取评论的内容
  pinglun_value(res) {
    this.setData({
      pinglun_value: res.detail.value
    });
  },

  // 跳转到购物车页面
  goToCart() {
    wx.navigateTo({
      url: '../cart/cart',
    });
  },

  // 评论
  getuserinfo(res) {
    var that = this;
    var id = that.data.array._id;
    var userName = '';
    var userImg = '';
    var time = util.formatTime(new Date());
    var neirong = that.data.pinglun_value;
    var pinglun = that.data.array.pinglun;
    
    if (!neirong) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    wx.getUserProfile({
      desc: '获取用户信息',
      success(res) {
        userName = res.userInfo.nickName;
        userImg = res.userInfo.avatarUrl;
        var array = {
          neirong: neirong,
          time: time,
          userName: userName,
          userImg: userImg
        };
        pinglun.push(array);
        
        wx.cloud.callFunction({
          name: 'updatePingLun',
          data: {
            id: id,
            pinglun: pinglun
          },
          success(res) {
            console.log("评论上传成功");
            wx.cloud.callFunction({
              name: 'selectProduct',
              data: {
                id: id
              },
              success(res) {
                console.log("最新内容为:", res.result.data);
                that.setData({
                  array: res.result.data[0],
                  pinglun_value: ''
                });
                wx.showToast({
                  title: '评论成功',
                  icon: 'success'
                });
              }
            });
          },
          fail(res) {
            console.log("评论上传失败", res);
          }
        });
      }
    });
  },

  // 收藏/取消收藏
  shoucang() {
    const that = this;
    const { isCollected, openid, array } = this.data;
    
    if (isCollected) {
      // 取消收藏
      db.collection('collection').where({
        _openid: openid,
        id: array._id
      }).get({
        success(res) {
          if (res.data.length > 0) {
            db.collection('collection').doc(res.data[0]._id).remove({
              success() {
                that.setData({ isCollected: false });
                wx.showToast({
                  title: '已取消收藏',
                  icon: 'success'
                });
              },
              fail(err) {
                console.error('取消收藏失败:', err);
              }
            });
          }
        },
        fail(err) {
          console.error('查询收藏失败:', err);
        }
      });
    } else {
      // 添加收藏
      db.collection('collection').add({
        data: {
          name: array.name,
          detail: array.detail,
          fenlei: array.fenlei,
          image: array.image,
          price: array.price,
          id: array._id
        },
        success() {
          that.setData({ isCollected: true });
          wx.showToast({
            title: '收藏成功',
            icon: 'success'
          });
        },
        fail(err) {
          console.error('收藏失败:', err);
        }
      });
    }
  },

  // 加入购物车
  addToShopping() {
    const that = this;
    const { openid, array } = this.data;
    
    db.collection('shopping_car').where({
      _openid: openid,
      id: array._id
    }).get({
      success(res) {
        if (res.data.length > 0) {
          wx.showToast({
            title: '商品已在购物车',
            icon: 'none'
          });
        } else {
          db.collection('shopping_car').add({
            data: {
              name: array.name,
              price: array.price,
              detail: array.detail,
              image: array.image,
              checked: true,
              num: 1,
              id: array._id,
              points: array.points || 0
            },
            success() {
              wx.showToast({
                title: '已加入购物车',
                icon: 'success',
                success() {
                  setTimeout(() => {
                    wx.navigateBack();
                  }, 1500);
                }
              });
            },
            fail(err) {
              console.error('加入购物车失败:', err);
            }
          });
        }
      },
      fail(err) {
        console.error('查询购物车失败:', err);
      }
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.array.name,
      imageUrl: this.data.array.image,
      path: `/pages/detail/detail?id=${this.data.id}`
    };
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    const id = options.id;
    
    this.setData({ id });
    
    wx.showLoading({ title: '加载中' });
    
    // 获取商品详情
    db.collection('product_shopping').doc(id).get({
      success(res) {
        that.setData({ array: res.data });
      },
      fail(err) {
        console.error('获取商品失败:', err);
      }
    });
    
    // 获取用户openid并检查收藏状态
    wx.cloud.callFunction({
      name: 'OpenId',
      success(res) {
        that.setData({ openid: res.result.openid });
        
        db.collection('collection').where({
          _openid: res.result.openid,
          id: id
        }).get({
          success(res) {
            wx.hideLoading();
            that.setData({ isCollected: res.data.length > 0 });
          },
          fail(err) {
            wx.hideLoading();
            console.error('检查收藏状态失败:', err);
          }
        });
      },
      fail(err) {
        wx.hideLoading();
        console.error('获取openid失败:', err);
      }
    });
    
    wx.showShareMenu({ withShareTicket: true });
  },

  // 其他生命周期函数保持不变
  onReady: function () {},
  onShow: function () {},
  onHide: function () {},
  onUnload: function () {},
  onPullDownRefresh: function () {},
  onReachBottom: function () {}
});