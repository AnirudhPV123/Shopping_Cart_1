const dbConnect = require('../config/connection')
const collections = require('../config/collections')
const objectId = require('mongodb').ObjectId



const bcrypt = require('bcrypt')
const { response } = require('express')
const { ObjectId } = require('mongodb')

const Razorpay=require('razorpay')


var instance = new Razorpay({
  key_id: 'rzp_test_6Na5eJ9PUgGq1g',
  key_secret: 'oqjaiyHseYcDYpI6gj4pWB6S',
});

module.exports = {
  doSignup: async (user, callback) => {

    user.Password = await bcrypt.hash(user.Password, 10)

    let database_connect = await dbConnect()
    let collection_connect = database_connect.collection(collections.USERS_COLLECTION)

    await collection_connect.insertOne(user)



    let response = {}

    response.user = user



    callback(response)
  },

  doLogin: async (userData, callback) => {

    let response = {}

    let database_connect = await dbConnect()
    let collection_connect = database_connect.collection(collections.USERS_COLLECTION)
    let user = await collection_connect.findOne({ Email: userData.Email })



    if (user) {
      bcrypt.compare(userData.Password, user.Password).then((status) => {
        if (status) {
          response.user = user
          response.status = true
          callback(response)

        } else {
          response.status = false
          callback(response)
        }
      })
    } else {
      response.status = false
      callback(response)
    }



  },

  addToCart: (productId, userId) => {

    let proObj = {
      item: new objectId(productId),
      quantity: 1
    }

    return new Promise(async (resolve, reject) => {

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)
      let userCart = await collection_connect.findOne({ user: new objectId(userId) })

      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == productId)

        if (proExist != -1) {
          let database_connect = await dbConnect()
          let collection_connect = database_connect.collection(collections.CART_COLLECTION)
          collection_connect.updateOne({user: new objectId(userId),'products.item': new objectId(productId) },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then(() => {
            resolve()
          })
        } else {
          let database_connect = await dbConnect()
          let collection_connect = database_connect.collection(collections.CART_COLLECTION)
          collection_connect.updateOne({ user: new objectId(userId) },
            {
              $push: { products: proObj }
            }
          ).then(() => {
            resolve()
          })
        }

      } else {

        let cartObj = {
          user: new objectId(userId),
          products: [proObj]
        }
        let database_connect = await dbConnect()
        let collection_connect = database_connect.collection(collections.CART_COLLECTION)
        await collection_connect.insertOne(cartObj)
      }

      resolve()
    })
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)

      let cartItems = await collection_connect.aggregate([
        {
          $match: { user: new objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collections.PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        }
      ]).toArray()
      resolve(cartItems)
    })
  },

  getProductCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)
      let cart = await collection_connect.findOne({ user: new objectId(userId) })

      let cartCount = 0

      if (cart) {
        cartCount = cart.products.length

      }
      resolve(cartCount)
    })
  },

  changeProductQuantity:(proDetails)=>{

    let count=parseInt(proDetails.count)

    return new Promise(async(resolve,reject)=>{

      if(count==0){
        let database_connect = await dbConnect()
        let collection_connect = database_connect.collection(collections.CART_COLLECTION)
        collection_connect.updateOne({_id: new objectId(proDetails.cart),'products.item': new objectId(proDetails.product) },
          {
           $pull:{products:{item:new objectId(proDetails.product)}}
          }
        ).then(()=>{
          resolve({removeProduct:0})
        })
      }

      else if(proDetails.quantity==1 && count==-1){
        let database_connect = await dbConnect()
        let collection_connect = database_connect.collection(collections.CART_COLLECTION)
        collection_connect.updateOne({_id: new objectId(proDetails.cart),'products.item': new objectId(proDetails.product) },
          {
           $pull:{products:{item:new objectId(proDetails.product)}}
          }
        ).then(()=>{
          resolve({removeProduct:1})
        })
      }else{
      
      let database_connect = await dbConnect()
          let collection_connect = database_connect.collection(collections.CART_COLLECTION)
          collection_connect.updateOne({_id: new objectId(proDetails.cart),'products.item': new objectId(proDetails.product) },
            {
              $inc: { 'products.$.quantity':count}
            }
          ).then(()=>{
            resolve(response)
          })
        }


    })
  },

  getTotalAmount:(orderId)=>{

    return new Promise(async (resolve, reject) => {
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)

      let total = await collection_connect.aggregate([
        {
          $match: { user: new objectId(orderId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collections.PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $group:{
            _id:null,
            total:{$sum:{$multiply:['$quantity','$product.Price']}}
          }
        }
        
       
      ]).toArray()
resolve(total[0].total)
    })

  },

  placeOrder:(order,product,totalAmount)=>{
    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)

      let status=order['payment-method']==='COD'?'placed':'pending'

      let orderObj={
        deliveryDetails:{
          address:order.address,
          pincode:parseInt(order.pincode),
          mobile:parseInt(order.mobile)
        },
        userId:new objectId(order.userId),
        paymentMethod:order['payment-method'],
        products:product,
        totalAmount:totalAmount,
        status:status,
        date:Date()

      }

      collection_connect.insertOne(orderObj).then(async(orderResponse)=>{
        let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)
      collection_connect.deleteOne({user:new objectId(order.userId)})


    let orderId=orderResponse.insertedId
    resolve(orderId)
      
      })

    })
    
  },

  getCartProductsOrder:(userId)=>{
    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.CART_COLLECTION)
     let product=await collection_connect.findOne({user:new objectId(userId)})

     resolve(product.products)

    })
  },

  getOrderDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)
     let orders=await collection_connect.find({userId:new objectId(userId)}).toArray()

     resolve(orders)
    })
  },

  orderViewProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)

      let orderItems = await collection_connect.aggregate([
        {
          $match: { _id: new objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collections.PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        }
        
       
      ]).toArray()
      resolve(orderItems)


    })
  },

  generateRazorpay:(orderId,totalAmount)=>{

   return new Promise((resolve,reject)=>{

    var options = {
      amount: totalAmount*100,  // amount in the smallest currency unit
      currency: "INR",
      receipt: ""+orderId
    };
    instance.orders.create(options, function(err, order) {
      
      if(err){
        console.log(err)
      }else{
      console.log("New order : ",order);
      resolve(order)
    }

    });

   })

  },

  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto=require('crypto')
      const hash=crypto.createHmac('sha256','oqjaiyHseYcDYpI6gj4pWB6S').update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']).digest('hex')


      if(hash==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }

    })
  },

  changePaymentStatus:(orderId)=>{
    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)
      collection_connect.updateOne({_id:new objectId(orderId)},
      {
        $set:{status:'placed'}
      }

      ).then(()=>{
        resolve()
      })

    })
  }
  


}




