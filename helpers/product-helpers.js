
const dbConnect = require('../config/connection')
const collections = require('../config/collections')
const objectId=require('mongodb').ObjectId



module.exports = {
  addProduct: async (product, callback) => {
    console.log(product.Price)
    

    let database_connect = await dbConnect()
    let collection_connect = database_connect.collection(collections.PRODUCTS_COLLECTION)

    let insertData = await collection_connect.insertOne({
      Name:product.Name,
      Category:product.Category,
      Price:parseInt(product.Price),
      Description:product.Description
    })
    callback(insertData.insertedId)
  },

  getProduct: async (callback) => {

    let database_connect = await dbConnect()
    let collection_connect = await database_connect.collection(collections.PRODUCTS_COLLECTION)
    let getData = await collection_connect.find().toArray()

    callback(getData)
  },

  deleteProduct:async(productId)=>{

    return new Promise(async(resolve,reject)=>{
      

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.PRODUCTS_COLLECTION)
      collection_connect.deleteOne({_id:new objectId(productId)}).then((response)=>{    
        resolve(response)
       })
    })
  },

  productDetails:async(productId)=>{

    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.PRODUCTS_COLLECTION)
      collection_connect.findOne({_id:new objectId(productId)}).then((product)=>{
        resolve(product)
      })

    })
  },

  productUpdate:async(updateId,updateProduct)=>{

    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.PRODUCTS_COLLECTION)
      collection_connect.updateOne(
        {_id:new objectId(updateId)},
        {$set:{
          Name:updateProduct.Name,
          Description:updateProduct.Description,
          Price:updateProduct.Price,
          Category:updateProduct.Category
        }}
        ).then(()=>{
          resolve()
        })

    })
  }


}







