// pages/index/index.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command

let currentPage = 0 // 当前第几页,0代表第一页 
let pageSize = 4 //每页显示多少数据 

Page({
  data: {
    swiperList: [
      'cloud://cloud1-6gnwx8yrf94c4823.636c-cloud1-6gnwx8yrf94c4823-1327900391/markIndex/1.png',
      'cloud://cloud1-6gnwx8yrf94c4823.636c-cloud1-6gnwx8yrf94c4823-1327900391/markIndex/2.png'
     
    ],
    msgList: [
      { url: "/miniprogram/pages/index/index.js", title: "<11·11>大牌新品推荐，折扣+满减，想不到的低价等你来抢" },
      { url: "/miniprogram/pages/index/index.js", title: "<11·11>新品推荐想不到的低价等你来抢" },
      { url: "/miniprogram/pages/index/index.js",title: "<11·11>大牌新品推荐，折扣+满减，想不到的低价等你来抢" }],
    array: [
      {img:'../../icons/collection.png',name:'我的收藏', url: '../myCollection/myCollection'},
      {img:'../../icons/points.png',name:'积分商城', url: '../points/points'}
    ],
    value1: 0,
    value2: 0,
    switch1: '',
    switch2: '',
    option1: [
      { text: '全部商品', value: 0 },
      { text: '新款商品', value: 1 }
    ],
    option2: [
      { text: '默认排序', value: 0 },
      { text: '好评排序', value: 1 },
      { text: '销量排序', value: 2 }
    ],
    openid: '',
    _openid: '',
    productList: [],
    orderList: [], // 商品排序后的结果
    loadMore: false, //"上拉加载"的变量，默认false，隐藏  
    loadAll: false, //"没有数据"的变量，默认false，隐藏
    searchKeyword: '' // 搜索关键词
  },

  // 搜索输入事件
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索按钮点击事件
  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '搜索中...',
    });

    db.collection('product_shopping')
      .where({
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .get()
      .then(res => {
        wx.hideLoading();
        if (res.data.length === 0) {
          wx.showToast({
            title: '未找到相关商品',
            icon: 'none'
          });
        }
        this.setData({
          productList: res.data,
          loadAll: true // 搜索结果显示全部，不需要加载更多
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
        console.error('搜索失败:', err);
      });
  },

  // 商品过滤排序：全部商品列
  onSwitch1Change({ detail }) {
    this.setData({ switch1: detail });
    if (this.data.switch1 == 1) {
      db.collection('product_shopping')
      .where({
        fenlei: '女装'
      })
      .get({
        success: (res) => {
          console.log(res.data);
          this.setData({
            orderList: res.data,
            productList: res.data
          })
        },
        fail: (err) => {
          console.log("失败", err);
        }
      })
    } else {
      // 重置为全部商品
      this.onLoad();
    }
  },

  // 商品过滤排序：默认排序列
  onSwitch2Change({ detail }) {
    this.setData({ switch2: detail });
    let orderByField = '';
    let order = 'desc';
    
    if (this.data.switch2 == 1) {
      orderByField = 'fenlei';
    } else if (this.data.switch2 == 2) {
      orderByField = 'points';
    } else {
      // 默认排序，重置
      this.onLoad();
      return;
    }
    
    db.collection('product_shopping')
      .orderBy(orderByField, order)
      .get({
        success: (res) => {
          console.log(res.data);
          this.setData({
            orderList: res.data,
            productList: res.data
          })
        },
        fail: (err) => {
          console.log("失败", err);
        }
      })
  },

  // 跳转商品详情页
  GoToProduct(res) {
    var id = res.currentTarget.dataset.id;
    console.log(id);
    wx.navigateTo({
      url: '../product/product?id='+id,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getData();
  },

  getData() {
    let that = this;
    //第一次加载数据
    if (currentPage == 1) {
      this.setData({
        loadMore: true, //把"上拉加载"的变量设为true，显示  
        loadAll: false //把"没有数据"设为false，隐藏  
      })
    }
    
    wx.showLoading({
      title: '加载中',
    });
    
    //云数据的请求
    db.collection('product_shopping').where({
      price: _.lt(10000)
    })
      .skip(currentPage * pageSize) //从第几个数据开始
      .limit(pageSize)
      .get({
        success(res) {
          wx.hideLoading();
          if (res.data && res.data.length > 0) {
            console.log("请求成功", res.data)
            currentPage++
            //把新请求到的数据添加到dataList里  
            let list = that.data.productList.concat(res.data)
            that.setData({
              productList: list, //获取数据数组    
              loadMore: false //把"上拉加载"的变量设为false，显示
            });
            if (res.data.length < pageSize) {
              that.setData({
                loadMore: false, //隐藏加载中。。
                loadAll: true //所有数据都加载完了
              });
            }
          } else {
            that.setData({
              loadAll: true, //把"没有数据"设为true，显示  
              loadMore: false //把"上拉加载"的变量设为false，隐藏  
            });
          }
        },
        fail(res) {
          wx.hideLoading();
          console.log("请求失败", res)
          that.setData({
            loadAll: false,
            loadMore: false
          });
        }
      })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log("上拉触底事件")
    let that = this
    if (!that.data.loadMore && !that.data.loadAll) {
      that.setData({
        loadMore: true, //加载中  
        loadAll: false //是否加载完所有数据
      });

      //加载更多，这里做下延时加载
      setTimeout(function() {
        that.getData()
      }, 2000)
    }
  },

  // 其他生命周期函数保持不变...
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onShareAppMessage() {}
})