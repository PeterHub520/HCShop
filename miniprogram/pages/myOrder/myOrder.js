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
    score: 0,
    searchKeyword: '', // 搜索关键词
    showSearch: false  // 是否显示搜索框
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
    
    // 如果有搜索关键词，应用搜索过滤
    if (that.data.searchKeyword) {
      filteredOrders = that.filterByKeyword(filteredOrders, that.data.searchKeyword);
    }
    
    that.setData({ array: filteredOrders });
  },

  // 根据关键词过滤订单
  filterByKeyword(orders, keyword) {
    if (!keyword) return orders;
    
    return orders.filter(order => {
      // 搜索订单ID
      if (order._id.includes(keyword)) return true;
      
      // 搜索订单状态
      if (order.state && order.state.includes(keyword)) return true;
      
      // 搜索商品名称
      if (order.product && order.product.some(product => 
        product.name && product.name.includes(keyword)
      )) return true;
      
      // 搜索时间
      if (order.time && order.time.includes(keyword)) return true;
      
      return false;
    });
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

  // 切换搜索框显示状态
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: ''
    }, () => {
      // 搜索框关闭时重置列表
      if (!this.data.showSearch) {
        this.applyFilter(this.data.select);
      }
    });
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.applyFilter(this.data.select);
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

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  stopPropagation(e) {
    // 空函数，仅用于阻止事件冒泡
  },

  deleteOrder(e) {
    console.log("---,",e.currentTarget.dataset.id)
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除此订单吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          wx.cloud.callFunction({
            name: 'deleteOrder',
            data: {
              id: orderId
            },
            success(res) {
              console.log("订单删除成功");
              wx.showToast({ title: '删除成功', icon: 'success' });
              that.refreshOrderList(); // 刷新订单列表
            },
            fail(err) {
              console.error("删除失败", err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            },
            complete() {
              wx.hideLoading();
            }
          });
        }
      }
    });
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