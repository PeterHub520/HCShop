// pages/orderDetail/orderDetail.js
Page({
    data: {
      orderData: {}
    },
  
    onLoad(options) {
      if (!options.id) {
        wx.showToast({ title: '订单ID缺失', icon: 'none' });
        return;
      }
      this.getOrderDetail(options.id);
    },
  
    // 获取订单详情（云开发）
    getOrderDetail(orderId) {
      wx.showLoading({ title: '加载详情' });
      wx.cloud.database().collection('order')
        .doc(orderId)
        .get()
        .then(res => {
          const orderData = res.data;
          // 处理科学计数法
          orderData.id = orderData.id.toString();
          this.setData({ orderData });
          wx.hideLoading();
        })
        .catch(err => {
          console.error('获取详情失败:', err);
          wx.showToast({ title: '加载失败，请重试', icon: 'none' });
          wx.hideLoading();
        });
    },
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