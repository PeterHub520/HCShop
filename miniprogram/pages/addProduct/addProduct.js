const db = wx.cloud.database();
Page({
    data: {
        productName: '',
        productDesc: '',
        productPrice: '',
        productFenlei: '',
        fileID: '',
        now: '新增',
        array: null,
        categories: [],
        selectedCategoryIndex: -1,
        isUploading: false,
        uploadProgress: 0,
        oldFileID: '', // 用于保存编辑时的旧图片ID
        productId: null // 用于保存编辑时的商品ID
    },

    getProductName(res) {
        this.setData({
            productName: res.detail
        });
    },

    getProductDesc(res) {
        this.setData({
            productDesc: res.detail
        });
    },

    getProductPrice(res) {
        this.setData({
            productPrice: res.detail
        });
    },

    getPicture() {
        if (this.data.isUploading) return;

        const that = this;
        const time = Date.now();
        const random = Math.floor(Math.random() * 10000);

        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                const filePath = res.tempFilePaths[0];
                that.setData({
                    isUploading: true,
                    uploadProgress: 0
                });

                const uploadTask = wx.cloud.uploadFile({
                    cloudPath: `products/${time}-${random}.${filePath.match(/\.(\w+)$/)[1]}`,
                    filePath: filePath,
                    success: function (uploadRes) {
                        // 如果是编辑模式，保存旧图片ID以便后续删除
                        if (that.data.now === '修改' && that.data.fileID) {
                            that.setData({
                                oldFileID: that.data.fileID
                            });
                        }

                        that.setData({
                            fileID: uploadRes.fileID,
                            isUploading: false
                        });
                    },
                    fail: function (err) {
                        console.error("上传失败", err);
                        that.setData({
                            isUploading: false
                        });
                        wx.showToast({
                            title: '上传失败',
                            icon: 'none'
                        });
                    }
                });

                uploadTask.onProgressUpdate((res) => {
                    that.setData({
                        uploadProgress: res.progress
                    });
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

    // 提交表单
    submit() {
        const that = this;
        const {
            productName,
            productDesc,
            productFenlei,
            productPrice,
            fileID,
            now,
            oldFileID,
            productId
        } = this.data;

        // 验证表单数据
        if (!productName) {
            wx.showToast({
                title: '请输入商品名称',
                icon: 'none'
            });
            return;
        }

        if (!productFenlei) {
            wx.showToast({
                title: '请选择商品分类',
                icon: 'none'
            });
            return;
        }

        if (!productPrice) {
            wx.showToast({
                title: '请输入商品价格',
                icon: 'none'
            });
            return;
        }

        if (!fileID) {
            wx.showToast({
                title: '请上传商品图片',
                icon: 'none'
            });
            return;
        }

        const price = parseFloat(productPrice) || 0;
        const productData = {
            name: productName,
            fenlei: productFenlei,
            desc: productDesc,
            price: price,
            image: fileID,
            updateTime: db.serverDate()
        };

        wx.showLoading({
            title: '处理中...',
            mask: true
        });

        if (now === '修改') {
            // 编辑模式
            productData.id = productId;

            wx.cloud.callFunction({
                name: 'updateProduct',
                data: productData,
                success: function (res) {
                    console.log('更新成功', res);
                    // 更新成功后删除旧图片
                    if (oldFileID) {
                        wx.cloud.deleteFile({
                            fileList: [oldFileID],
                            success: () => console.log('旧图片删除成功'),
                            fail: err => console.error('旧图片删除失败', err)
                        });
                    }

                    wx.hideLoading();
                    wx.showToast({
                        title: '更新成功',
                        icon: 'success',
                        duration: 1000,
                        success: () => {
                            setTimeout(() => {
                                wx.navigateBack();
                            }, 1000);
                        }
                    });
                },
                fail: (err) => {
                    console.error("更新失败", err);
                    wx.hideLoading();
                    wx.showToast({
                        title: '更新失败',
                        icon: 'none'
                    });
                }
            });
        } else {
            // 新增模式
            productData.createTime = db.serverDate();

            db.collection('product_shopping').add({
                data: productData,
                success: function (res) {
                    console.log('添加成功', res);
                    wx.hideLoading();
                    wx.showToast({
                        title: '添加成功',
                        icon: 'success',
                        duration: 2000,
                        success: () => {
                            setTimeout(() => {
                                wx.navigateBack();
                            }, 2000);
                        }
                    });
                },
                fail: (err) => {
                    // 新增失败时删除已上传的图片
                    if (fileID) {
                        wx.cloud.deleteFile({
                            fileList: [fileID],
                            fail: err => console.error('图片删除失败', err)
                        });
                    }

                    console.error("添加失败", err);
                    wx.hideLoading();
                    wx.showToast({
                        title: '添加失败',
                        icon: 'none'
                    });
                }
            });
        }
    },

    // 预览图片
    previewImage() {
        wx.previewImage({
            urls: [this.data.fileID],
            current: this.data.fileID
        });
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
                    if (options && options.id) {
                        try {
                            const productData = JSON.parse(decodeURIComponent(options.data));

                            // 查找对应的分类索引
                            const categoryIndex = categories.findIndex(
                                cat => cat.name === productData.fenlei
                            );

                            that.setData({
                                now: '修改',
                                array: productData,
                                productName: productData.name || '',
                                productDesc: productData.desc || '',
                                productPrice: productData.price ? productData.price.toString() : '',
                                productFenlei: productData.fenlei || '',
                                fileID: productData.image || '',
                                selectedCategoryIndex: categoryIndex,
                                productId: productData._id || '',
                                oldFileID: productData.image || '' // 初始化旧图片ID
                            });
                        } catch (e) {
                            console.error('解析商品数据失败', e);
                            wx.showToast({
                                title: '加载商品信息失败',
                                icon: 'none'
                            });
                        }
                    }
                }
            },
            fail: err => {
                console.error('获取分类失败:', err);
                wx.showToast({
                    title: '获取分类失败',
                    icon: 'none'
                });
            }
        });
    }
});