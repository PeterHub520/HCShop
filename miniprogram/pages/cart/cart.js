// pages/cart/cart.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    array: [],
    openid: '',
    Money: 0
  },

  // 结算
  jiesuan(res) {
    const that = this;
    const product = [];
    const deleteIds = []; // 记录需要删除的商品ID

    for (let i = 0; i < that.data.array.length; i++) {
      if (that.data.array[i].checked) {
        product.push(that.data.array[i]);
        deleteIds.push(that.data.array[i]._id); // 收集要删除的ID
      }
    }

    // 批量删除已选商品（结算后移除购物车）
    if (deleteIds.length > 0) {
      db.collection('shopping_car')
        .where({
          _id: _.in(deleteIds)
        })
        .remove({
          success: () => {
            console.log('结算后删除已选商品成功');
            that.onLoad(); // 刷新购物车
          },
          fail: (err) => {
            console.error('删除已选商品失败:', err);
          }
        });
    }

    const productAll = JSON.stringify(product);
    wx.navigateTo({
      url: `../address/address?productAll=${encodeURIComponent(productAll)}`,
    });
  },

  // 减少商品数量
  reduce(res) {
    const that = this;
    const id = res.currentTarget.dataset.id;
    let array = that.data.array;

    for (let i = 0; i < array.length; i++) {
      if (array[i]._id === id) {
        if (array[i].num <= 1) {
          // 数量为1时，询问是否删除商品
          wx.showModal({
            title: '提示',
            content: '数量已达最小值，是否删除该商品？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 删除商品
                db.collection('shopping_car')
                  .doc(id)
                  .remove({
                    success: () => {
                      wx.showToast({ title: '商品已删除' });
                      array.splice(i, 1); // 从数组中移除
                      that.setData({ array });
                      that.countMoney();
                    },
                    fail: (err) => {
                      console.error('删除商品失败:', err);
                    }
                  });
              }
            }
          });
          break;
        }

        array[i].num -= 1;
        that.updateProductNum(array[i]._id, array[i].num);
        that.setData({ array });
        that.countMoney();
        break;
      }
    }
  },

  // 增加商品数量
  add(res) {
    const that = this;
    const id = res.currentTarget.dataset.id;
    let array = that.data.array;

    for (let i = 0; i < array.length; i++) {
      if (array[i]._id === id) {
        array[i].num += 1;
        that.updateProductNum(array[i]._id, array[i].num);
        that.setData({ array });
        that.countMoney();
        break;
      }
    }
  },

  // 监听数量输入
  onNumInput(e) {
    const that = this;
    const index = e.currentTarget.dataset.index;
    let array = [...that.data.array]; // 创建数组副本避免直接修改原数据
    let value = e.detail.value;
    
    // 处理非数字输入
    if (value === '' || isNaN(value) || value < 1) {
      value = 1;
    }
    
    // 转换为整数
    value = parseInt(value);
    
    // 检查数组和索引是否有效
    if (Array.isArray(array) && index >= 0 && index < array.length) {
      // 更新数组副本
      array[index] = { ...array[index], num: value };
      
      // 更新数据并立即计算价格
      that.setData({ array }, () => {
        that.countMoney();
        // 异步更新数据库
        that.updateProductNum(array[index]._id, value);
      });
    } else {
      console.error('无效的数组索引:', index);
    }
  },

  // 更新数据库中的商品数量
  updateProductNum(id, num) {
    db.collection('shopping_car')
      .doc(id)
      .update({
        data: {
          num: num
        },
        success: (res) => {
          console.log('更新商品数量成功', res);
        },
        fail: (err) => {
          console.error('更新商品数量失败', err);
        }
      });
  },

  // 计算总金额
  countMoney() {
    const that = this;
    let Money = 0;
    const array = that.data.array;

    for (let i = 0; i < array.length; i++) {
      if (array[i].checked) {
        Money += array[i].price * array[i].num;
      }
    }

    that.setData({ Money: Money.toFixed(1) });
    console.log('总金额:', that.data.Money);
  },

  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    const that = this;
    wx.showLoading({ title: '加载中' });

    wx.cloud.callFunction({
      name: 'OpenId',
      success: (res) => {
        that.setData({ openid: res.result.openid });
        db.collection('shopping_car')
          .where({ _openid: that.data.openid })
          .get({
            success: (res) => {
              wx.hideLoading();
              that.setData({ array: res.data });
              that.countMoney();
            },
            fail: (res) => {
              console.log('获取购物车失败');
            }
          });
      }
    });
  },

  // 页面显示时刷新数据
  onShow: function () {
    this.onLoad();
  },

  // 其他函数保持不变...
});