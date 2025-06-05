// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id, name, fenlei, desc, price, image } = event
  
  try {
    await db.collection('product_shopping').doc(id).update({
      data: {
        name,
        fenlei,
        desc,
        price,
        image,
        updateTime: db.serverDate()
      }
    })
    
    return {
      status: 200,
      message: '更新成功'
    }
  } catch (err) {
    console.error('更新失败', err)
    return {
      status: 500,
      message: '更新失败'
    }
  }
}