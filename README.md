# wechat-app-EShop

* 微信小程序+云开发电商类的小程序 

* 主要功能：商品分类、购物车、收藏、个人中心、会员、积分商城、后台管理


* 数据表
shopping_car：用于存储用户的购物车信息。
address：用于存储用户的收货地址信息。
product_shopping：用于存储商品信息。
collection：用于存储用户的收藏信息。
points_shopping：用于存储积分商城的商品信息。

product_categories：分类
order：用于存储用户的订单信息。

## TODO
-  你应该能够找出点击 “待收货” 跳转到 pages/member/member 页面的原因。



## 项目准备

* 请把 `AppId` 修改为自己的（详情 -> 基本信息 -> AppId）；
* 构建 `vant` 组件库（工具 -> 构建 npm）；
* 在项目根目录下的`project.config.json`指定微信云开发的启动目录；

 ```json
"cloudfunctionRoot": "cloudfunctions/"
 ```

* 指定微信云开发的运行环境ID（**cloudfunctions目录下右键 -> 当前环境**），一般来说开通了云开发服务都会有的；

  若没有出现环境，请检查自己是否有环境ID（打开云开发界面，要是也没有，检查自己的服务是否配置对）；

* 指定好环境后，**cloudfunctions目录下右键 -> 同步云函数列表**



## 其它

* 因微信支付功能要基于企业或团队，本人是个人开发者，所以项目中的支付功能只是模拟，没有实际功能；
* 进入后台管理的密码是 `123456`



### 帮助

**如遇到无法解决的问题可以私信我或者通过邮箱[[A1962400598@163.com](mailto:A1962400598@163.com)]联系我 ** ՞•ᴥ•՞

