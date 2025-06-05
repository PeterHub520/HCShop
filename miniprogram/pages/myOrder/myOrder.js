const app = getApp()
const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    select_arr: ['全部订单', '待收货', '已完成'],
    select: '',
    openid: '',
    array: [],    // 当前显示的订单列表
    all: [],      // 所有订单的缓存
    score: 0
  },

  // 跳转到订单详情页
  toOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?id=${orderId}`
    });
  },

  // 确认收货
  ok(res) {
    var that = this;
    var id = res.currentTarget.dataset.id;
    var state = res.currentTarget.dataset.state;
    
    if (state == '待收货') {
      wx.showLoading({ title: '处理中...' });
      
      wx.cloud.callFunction({
        name: 'updateOrder',
        data: {
          id: id,
          state: '已完成'
        },
        success(res) {
          console.log("订单状态更新完成");
          that.refreshOrderList(); // 刷新订单列表
        },
        fail(res) {
          console.log("更新失败", res);
          wx.showToast({ title: '操作失败', icon: 'none' });
        },
        complete() {
          wx.hideLoading();
        }
      });
    }
  },

  // 刷新订单列表（带排序）
  refreshOrderList() {
    var that = this;
    
    db.collection('order')
      .where({
        _openid: that.data.openid
      })
      .orderBy('time', 'desc') // 按时间降序排序
      .get()
      .then(res => {
        const allOrders = res.data;
        that.setData({ all: allOrders });
        
        // 重新应用筛选条件
        that.applyFilter(that.data.select);
        
        // 更新积分
        that.updateScore(allOrders);
      })
      .catch(err => {
        console.error('获取订单失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 应用筛选条件
  applyFilter(state) {
    var that = this;
    let filteredOrders = [];
    
    if (state == '全部订单') {
      filteredOrders = that.data.all;
    } else {
      filteredOrders = that.data.all.filter(item => item.state == state);
    }
    
    that.setData({ array: filteredOrders });
  },

  // 更新积分
  updateScore(orderList) {
    let scoreList = 0;
    
    orderList.forEach(order => {
      if (order.product && order.product.length > 0) {
        scoreList += order.product[0].points || 0;
      }
    });
    
    app.globalData.score = scoreList;
    this.setData({ score: scoreList });
    
    wx.setStorage({
      key: 'score',
      data: scoreList,
      success: () => {
        console.log('写入score缓存成功');
      },
      fail: () => {
        console.log('写入score发生错误');
      }
    });
  },

  // 选择订单状态
  select(res) {
    var state = res.currentTarget.dataset.state;
    this.setData({ select: state });
    this.applyFilter(state);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var name = options.name || '全部订单';
    
    wx.showLoading({ title: '加载中' });
    
    // 获取用户OpenID
    wx.cloud.callFunction({
      name: 'OpenId',
      success(res) {
        that.setData({ openid: res.result.openid });
        
        // 获取订单列表（按时间降序）
        db.collection('order')
          .where({
            _openid: res.result.openid
          })
          .orderBy('time', 'desc') // 关键排序代码
          .get()
          .then(res => {
            const allOrders = res.data;
            that.setData({ all: allOrders });
            
            // 应用初始筛选
            that.setData({ select: name });
            that.applyFilter(name);
            
            // 计算积分
            that.updateScore(allOrders);
            
            wx.hideLoading();
          })
          .catch(err => {
            console.error('获取订单失败:', err);
            wx.showToast({ title: '加载失败', icon: 'none' });
            wx.hideLoading();
          });
      },
      fail(err) {
        console.error('获取OpenID失败:', err);
        wx.showToast({ title: '登录失败', icon: 'none' });
        wx.hideLoading();
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时刷新订单列表
    if (this.data.openid) {
      this.refreshOrderList();
    }
  },

  // 其他生命周期函数保持不变...

    // 返回上一页
    goBack() {
        wx.navigateBack();
      },
    
      /**
       * 用户点击右上角分享
       */
      onShareAppMessage() {
        const order = this.data.orderData;
        
        return {
          title: `订单分享：${order.id}`,
          path: `/pages/orderDetail/orderDetail?id=${order._id}`,
          imageUrl: order.product && order.product[0]?.image || '', // 使用第一个商品图片作为分享图
          success: (res) => {
            wx.showToast({ title: '分享成功', icon: 'success' });
          },
          fail: (err) => {
            wx.showToast({ title: '分享失败', icon: 'none' });
          }
        };
      }
});