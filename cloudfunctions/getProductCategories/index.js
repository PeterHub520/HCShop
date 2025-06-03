// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const res = await db.collection('product_categories').get()
    return {
      status: 200,
      message: '获取商品分类成功',
      data: res.data
    }
  } catch (e) {
    console.error('获取商品分类失败:', e)
    return {
      status: 500,
      message: '获取商品分类失败',
      error: e.message
    }
  }
}