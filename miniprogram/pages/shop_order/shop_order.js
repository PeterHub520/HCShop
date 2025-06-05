const app = getApp()
const db = wx.cloud.database();
const util = require('../util.js');

Page({
  data: {
    isMember: '',
    array: [],
    product: [],
    allMoney: 0,
    openid: '',
    totalPoints: 0,
    orderId: null
  },

  // 支付功能
  pay(res) {
    var that = this;
    wx.showModal({
      title: '交易提示',
      content: '确认支付' + that.data.allMoney + '元?',
      success(res) {
        if (res.confirm == true) {
          that.createOrder();
        }
      },
      fail(res) {
        console.log("支付弹窗失败", res);
      }
    })
  },

  // 创建订单
  createOrder() {
    const that = this;
    const time = Date.parse(new Date());
    const id = time / 1000;
    const timeNow = util.formatTime(new Date());
    
    // 生成商品名称字符串
    const productName = this.data.product.map(item => 
      `${item.name} x ${item.num}`
    ).join(' ');

    // 1. 先删除购物车商品
    this.deleteCartItems(() => {
      // 2. 创建订单
      db.collection("order").add({
        data: {
          id: id,
          product: that.data.product,
          address: that.data.array,
          time: timeNow,
          state: '待收货',
          allMoney: that.data.allMoney,
          points: that.data.totalPoints,
          openid: that.data.openid
        },
        success(res) {
          console.log("订单创建成功", res);
          that.setData({ orderId: id });
          
          // 3. 记录积分变动
          that.recordPointsChange(that.data.totalPoints, () => {
            wx.showToast({
              title: '支付成功',
              duration: 1000,
              success() {
                wx.reLaunch({
                    url: '../myOrder/myOrder'
                  });
              }
            });
          });
        },
        fail(res) {
          console.error("订单创建失败", res);
          wx.showToast({
            title: '订单创建失败',
            icon: 'none'
          });
        }
      });
    });
  },

  // 删除购物车商品
  deleteCartItems(callback) {
    const promises = this.data.product.map(item => {
      return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'delete',
          data: { id: item._id },
          success(res) {
            console.log("删除成功", item._id);
            resolve();
          },
          fail(err) {
            console.error("删除失败", err);
            reject(err);
          }
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        console.log("所有商品删除成功");
        callback();
      })
      .catch(err => {
        console.error("部分商品删除失败", err);
        // 即使删除失败也继续创建订单
        callback();
      });
  },

  // 记录积分变动
  recordPointsChange(points, callback) {
    if (!points || points <= 0) {
      callback();
      return;
    }

    db.collection("points_log").add({
      data: {
        openid: this.data.openid,
        points: points,
        type: 'add',
        order_id: this.data.orderId,
        create_time: db.serverDate(),
        description: '购物获得积分'
      },
      success(res) {
        console.log("积分记录成功", res);
        callback();
      },
      fail(err) {
        console.error("积分记录失败", err);
        // 即使积分记录失败也继续流程
        callback();
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.initData(options);
    this.getUserOpenId();
  },

  // 初始化数据
  initData(options) {
    try {
      const array = JSON.parse(options.array);
      const queryProduct = decodeURIComponent(options.productAll);
      const productAll = JSON.parse(queryProduct);
      
      let product = [];
      let allMoney = 0;
      let totalPoints = 0;

      // 处理商品数据
      productAll.forEach(itemStr => {
        const item = JSON.parse(itemStr);
        item.points = Math.floor(item.price * item.num); // 1元=1积分
        product.push(item);
        totalPoints += item.points;
        allMoney += item.price * item.num;
      });

      this.setData({
        isMember: app.globalData.isMember,
        array: array,
        product: product,
        allMoney: allMoney.toFixed(1),
        totalPoints: totalPoints
      });

      console.log('初始化数据完成', this.data);
    } catch (err) {
      console.error('数据初始化失败', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 获取用户openid
  getUserOpenId() {
    wx.cloud.callFunction({
      name: 'OpenId',
      success: (res) => {
        this.setData({ openid: res.result.openid });
      },
      fail: (err) => {
        console.error('获取openid失败', err);
      }
    });
  },

  // 其他生命周期函数保持不变
  onReady: function() {},
  onShow: function() {},
  onHide: function() {},
  onUnload: function() {},
  onPullDownRefresh: function() {},
  onReachBottom: function() {},
  onShareAppMessage: function() {}
});