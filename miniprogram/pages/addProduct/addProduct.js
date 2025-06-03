const db = wx.cloud.database();
Page({
    data: {
        productName: '',
        productDesc: '',
        productPrice: '',
        productFenlei: '',
        fileID: '',
        now: '新增', // 默认状态设为新增
        array: null, // 改为null判断更清晰
        categories: [],
        selectedCategoryIndex: -1
    },

    getProductName(res) {
        this.setData({
            productName: res.detail.value
        });
    },

    getProductDesc(res) {
        this.setData({
            productDesc: res.detail.value
        });
    },

    getProductPrice(res) {
        const value = res.detail.value;
        if (value === '' || !isNaN(value)) {
            this.setData({
                productPrice: value
            });
        } else {
            wx.showToast({
                title: '请输入数字',
                icon: 'none',
                duration: 2000 // 设置显示时长
            });
        }
    },

    getPicture() {
        const num = Math.floor(Math.random() * 10000);
        const time = Date.now();

        wx.chooseImage({
            count: 1,
            success: (res) => {
                wx.showLoading({
                    title: '上传中'
                });
                wx.cloud.uploadFile({
                    cloudPath: `shop/${time}-${num}`,
                    filePath: res.tempFilePaths[0],
                    success: (uploadRes) => {
                        this.setData({
                            fileID: uploadRes.fileID
                        });
                        wx.hideLoading();
                    },
                    fail: (uploadErr) => {
                        console.error("上传失败", uploadErr);
                        wx.showToast({
                            title: '上传失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                });
            },
            fail: (err) => {
                console.error("选择图片失败", err);
                wx.showToast({
                    title: '选择图片失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    selectCategory(e) {
        const index = e.detail.value;
        if (index >= 0 && index < this.data.categories.length) {
            const selectedCategory = this.data.categories[index];
            this.setData({
                selectedCategoryIndex: index,
                productFenlei: selectedCategory.name
            });
        }
    },

    submit() {
        const {
            productName,
            productDesc,
            productFenlei,
            productPrice,
            fileID,
            now,
            array
        } = this.data;

        if (!productName || !productDesc || !productFenlei || !productPrice || !fileID) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        if (now === '修改') {
            wx.cloud.callFunction({
                name: 'updateProduct',
                data: {
                    id: array._id,
                    name: productName,
                    fenlei: productFenlei,
                    desc: productDesc,
                    price: parseFloat(productPrice),
                    image: fileID
                },
                success: () => {
                    wx.redirectTo({
                        url: '../admin/admin',
                        success: () => {
                            wx.showToast({
                                title: '修改成功',
                                duration: 2000
                            });
                        }
                    });
                },
                fail: (err) => {
                    console.error("信息修改失败", err);
                    wx.showToast({
                        title: '修改失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
        } else {
            const db = wx.cloud.database();
            db.collection('product_shopping').add({
                data: {
                    name: productName,
                    fenlei: productFenlei,
                    desc: productDesc,
                    price: parseFloat(productPrice),
                    image: fileID
                },
                success: () => {
                    wx.showToast({
                        title: '上传成功',
                        duration: 2000,
                        success: () => {
                            wx.redirectTo({
                                url: '../admin/admin'
                            });
                        }
                    });
                },
                fail: (err) => {
                    console.error("上传失败", err);
                    wx.showToast({
                        title: '上传失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
        }
    },

    onLoad: function (options) {
        const that = this;

        // 获取商品分类
        wx.cloud.callFunction({
            name: 'getProductCategories',
            success: res => {
                if (res.result.status === 200) {
                    const categories = res.result.data;
                    that.setData({
                        categories
                    });

                    // 检查是否是编辑模式
                    if (options && options.data) {
                        try {
                            const array = JSON.parse(decodeURIComponent(options.data));
                            that.setData({
                                array,
                                now: '修改',
                                productName: array.name,
                                productFenlei: array.fenlei,
                                productDesc: array.desc,
                                productPrice: array.price.toString(), // 确保是字符串
                                fileID: array.image
                            });

                            // 设置选中的分类索引
                            const index = categories.findIndex(item => item.name === array.fenlei);
                            if (index !== -1) {
                                that.setData({
                                    selectedCategoryIndex: index
                                });
                            }
                        } catch (e) {
                            console.error('解析数据失败', e);
                        }
                    }
                } else {
                    console.error('获取商品分类失败:', res.result.message);
                }
            },
            fail: err => {
                console.error('调用云函数失败:', err);
                wx.showToast({
                    title: '获取分类失败',
                    icon: 'none'
                });
            }
        });
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