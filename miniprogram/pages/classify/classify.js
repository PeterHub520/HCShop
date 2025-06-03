const db = wx.cloud.database();
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    left_name: [], // 动态存储分类数据
    all: [],
    product: [],
    id: 0,
    num: 0,
    name: ''
  },

  // 跳转商品详情页
  GoToProduct(res) {
    var that = this;
    var id = res.currentTarget.dataset.id;
    console.log(id);
    wx.navigateTo({
      url: '../product/product?id=' + id,
    })
  },

  // 显示对应分类的商品
  selectId(res) {
    var that = this;
    var name = res.currentTarget.dataset.name;
    var array = [];
    that.setData({
      name: name
    })
    for (var j = 0; j < that.data.all.length; j++) {
      if (that.data.all[j].fenlei == name) {
        array.push(that.data.all[j]);
      }
    }
    that.setData({
      product: array
    })
    console.log(that.data.product)
  },

  // 获取所有分类数据
  getCategories() {
    var that = this;
    db.collection('product_shopping').field({
      fenlei: true
    }).get({
      success: function (res) {
        var categories = [];
        var categoryMap = {};
        res.data.forEach(item => {
          if (!categoryMap[item.fenlei]) {
            categoryMap[item.fenlei] = true;
            categories.push({ name: item.fenlei });
          }
        });
        that.setData({
          left_name: categories
        });
      },
      fail: function (err) {
        console.error('获取分类数据失败', err);
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var array = [];
    var name = app.globalData.name;
    wx.showLoading({
      title: '加载中',
    })

    // 获取所有分类数据
    that.getCategories();

    if (name == '') {
      console.log("执行if");
      wx.cloud.callFunction({
        name: 'findProduct',
        success(res) {
          that.setData({
            product: res.result.data,
            all: res.result.data
          })
          wx.hideLoading({
            success: (res) => { },
          })
        }
      })
    } else {
      console.log("执行else");
      that.setData({
        name: name
      })
      wx.cloud.callFunction({
        name: 'findProduct',
        success(res) {
          that.setData({
            product: res.result.data,
            all: res.result.data
          })
          wx.hideLoading({
            success: (res) => { },
          })
          console.log(that.data.product)
          for (var i = 0; i < that.data.product.length; i++) {
            if (that.data.product[i].fenlei == name) {
              console.log("-------")
              array.push(that.data.product[i]);
            }
          }
          console.log(array);
          that.setData({
            product: array
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.onLoad();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})