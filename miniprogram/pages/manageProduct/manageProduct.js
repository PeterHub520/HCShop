const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        product: ''
    },

    // 跳转到添加商品页面
    goToAddProduct() {
        wx.navigateTo({
            url: '../addProduct/addProduct',
        });
    },

    update(res) {
        var that = this;
        var id = res.currentTarget.dataset.id;
        var array = [];
        for (var i = 0; i < that.data.product.length; i++) {
            if (that.data.product[i]._id == id) {
                array = JSON.stringify(that.data.product[i]);
            }
        }
        console.log(array);
        wx.redirectTo({
            url: '../addProduct/addProduct?data=' + encodeURIComponent(array),
        })
    },

    // 删除商品项
    onDeleteItem(e) {
        const {
            id,
            image
        } = e.currentTarget.dataset;
        const that = this;

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个商品吗？',
            success(res) {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...'
                    });

                    // 1. 删除数据库记录
                    db.collection('product_shopping').doc(id).remove({
                        success() {
                            // 2. 删除云存储图片
                            if (image) {
                                wx.cloud.deleteFile({
                                    fileList: [image],
                                    success() {
                                        wx.hideLoading();
                                        that.refreshData(); // 刷新数据
                                        wx.showToast({
                                            title: '删除成功'
                                        });
                                    },
                                    fail(err) {
                                        console.error('图片删除失败:', err);
                                        wx.hideLoading();
                                        that.refreshData(); // 仍然刷新数据
                                        wx.showToast({
                                            title: '商品已删除，但图片删除失败',
                                            icon: 'none'
                                        });
                                    }
                                });
                            } else {
                                wx.hideLoading();
                                that.refreshData(); // 刷新数据
                                wx.showToast({
                                    title: '删除成功'
                                });
                            }
                        },
                        fail(err) {
                            console.error('删除失败:', err);
                            wx.hideLoading();
                            wx.showToast({
                                title: '删除失败',
                                icon: 'none'
                            });
                        }
                    });
                }
            }
        });
    },

    // 编辑商品项
    onEditItem(e) {
        const that = this;
        const id = e.currentTarget.dataset.id; // 获取商品ID
        const products = that.data.product; // 获取商品列表

        // 查找要编辑的商品
        let productToEdit = {};
        for (let i = 0; i < products.length; i++) {
            if (products[i]._id === id) {
                productToEdit = products[i];
                break;
            }
        }

        console.log('要编辑的商品:', productToEdit);

        // 跳转到编辑页面并传递商品数据
        wx.redirectTo({
            url: '../addProduct/addProduct?data=' + encodeURIComponent(JSON.stringify(productToEdit)),
        });
    },
    delete(res) {
        var that = this;
        var id = res.currentTarget.dataset.id;
        console.log('id', id);
        var fileID = res.currentTarget.dataset.fileid;
        wx.showLoading({
            title: '处理中',
        })
        db.collection('product_shopping').doc(id).remove({})
        wx.hideLoading()
        // wx.cloud.callFunction({
        //   name:'deleteProduct',
        //   data:{
        //     id:id
        //   },
        //   success(res){
        //     console.log("商品信息删除成功");
        //     wx.cloud.deleteFile({
        //       fileList:[fileID],
        //       success(res){
        //         console.log("商品图片删除成功");
        //         wx.hideLoading({
        //           success: (res) => {
        //             wx.showToast({
        //               title: '删除成功',
        //             })
        //             that.onLoad();
        //           },
        //         })
        //       },
        //       fail(res){
        //         console.log("商品图片删除失败",res);
        //       }
        //     })
        //   },
        //   fail(res){
        //     console.log("商品信息删除失败",res);
        //   }
        // })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        wx.cloud.callFunction({
            name: 'findProduct',
            success(res) {
                that.setData({
                    product: res.result.data
                })
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },
    // addProduct.js
    submit(res) {
        var that = this;
        if (that.data.productName == '' || that.data.productDesc == '' || that.data.productFenLei == '' || that.data.productPrice == '') {
            wx.showToast({
                title: '请完整填写信息',
            });
        } else {
            if (that.data.now == '修改') {
                wx.cloud.callFunction({
                    name: 'updateProduct',
                    data: {
                        id: that.data.array._id,
                        name: that.data.productName,
                        fenlei: that.data.productFenLei,
                        desc: that.data.productDesc,
                        price: that.data.productPrice,
                        image: that.data.fileID
                    },
                    success(res) {
                        console.log("信息修改成功");
                        wx.navigateBack({
                            success: () => {
                                wx.showToast({
                                    title: '修改成功',
                                    duration: 3000
                                });
                            }
                        });
                    },
                    fail(res) {
                        console.log("信息修改失败", res);
                    }
                });
            } else {
                db.collection('product_shopping').add({
                    data: {
                        name: that.data.productName,
                        fenlei: that.data.productFenLei,
                        desc: that.data.productDesc,
                        price: that.data.productPrice,
                        image: that.data.fileID
                    },
                    success(res) {
                        console.log("上传成功");
                        wx.navigateBack({
                            success: () => {
                                wx.showToast({
                                    title: '上传成功',
                                });
                            }
                        });
                    },
                    fail(res) {
                        console.log("上传失败", res);
                    }
                });
            }
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    // manageProduct.js
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