
const dbConnect = require('../config/connection')
const collections = require('../config/collections')
const objectId=require('mongodb').ObjectId

const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')




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
  },

  // adminSignUp:async()=>{

  //  admin={
  //   Name:'Anirudh',
  //   Email:'anirudhpv@gmail.com',
  //   Password:await bcrypt.hash('123',10)
  //  }
    
    

  //   let database_connect = await dbConnect()
  //     let collection_connect = database_connect.collection(collections.ADMIN_COLLECTION)

  //     collection_connect.insertOne(admin)

  // }

  checkAdmin:async(loginDetails,callback)=>{

    let response={}

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ADMIN_COLLECTION)
      
      if(loginDetails.Email=='anirudhpv@gmail.com'){

      let admin = await collection_connect.findOne({ Email: loginDetails.Email })



      if (admin) {
        bcrypt.compare(loginDetails.Password, admin.Password).then((status) => {
          if (status) {
            response.admin = admin
            response.status = true
            response.masterAdmin=true
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


    }else{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.NEWADMINS_COLLECTION)

      let admin = await collection_connect.findOne({ Email: loginDetails.Email })



      if (admin) {
        bcrypt.compare(loginDetails.Password, admin.Password).then((status) => {
          if (status) {
            response.admin = admin
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

    }
  

   
    

  },

  createNewAdmin:(newAdminDetails)=>{
    return new Promise(async(resolve,reject)=>{


      
        // Name:newAdminDetails.Name,
        // Email:newAdminDetails.Email,
        // Password:await bcrypt.hash(newAdminDetails.Password,10)
    
newAdminDetails.Password=await bcrypt.hash(newAdminDetails.Password,10)

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.NEWADMINS_COLLECTION)

      let check=await collection_connect.findOne({Email:newAdminDetails.Email})

      if(check){
        let message='Admin account already exist'
        resolve(message)
      }else{
        let database_connect = await dbConnect()
        let collection_connect = database_connect.collection(collections.NEWADMINS_COLLECTION)
      let adminResponse=await collection_connect.insertOne(newAdminDetails)
resolve()
    }

    })
  },

  getAllOrderDetails:()=>{
    return new Promise(async(resolve,reject)=>{
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)
     let orders=await collection_connect.find().toArray()

     resolve(orders)
    })
  },

  getProductDetails:()=>{

    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.ORDER_COLLECTION)

      let allproductDetails = await collection_connect.aggregate([

       {
        $project:{
          item:'$products.item',
          quantity:'$products.quantity',
          address:'$deliveryDetails.address',
          pincode:'$deliveryDetails.pincode',
          mobile:'$deliveryDetails.mobile',
          totalAmount:'$totalAmount',
          paymentMethod:'$paymentMethod',
          status:'$status',
          date:'$date'
        }
       },

       {
        $lookup:{
          from:collections.PRODUCTS_COLLECTION,
          localField:'item',
          foreignField:'_id',
          as:'product'
        } 
       },
       {
       $project:{
         address:1,pincode:1,mobile:1,totalAmount:1,paymentMethod:1,status:1,date:1,item:1,
         product:'$product.Name',
         quantity:1          
       }
      }


      ]).toArray()

      // console.log(allproductDetails[0].product.Name)

      // console.log(allproductDetails[0].products[0].item)

      console.log(allproductDetails)

      resolve(allproductDetails)


    })

  },

  getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{

      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.USERS_COLLECTION)
      let users=await collection_connect.find().toArray()


      resolve(users)

    })
  },

  getAllAdmins:()=>{
    return new Promise(async(resolve,reject)=>{
      let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.NEWADMINS_COLLECTION)
      let allAdmins=await collection_connect.find().toArray()

      resolve(allAdmins)
    })
  },

  removeAdmins:(removeId)=>{
    return new Promise(async(resolve,reject)=>{

    let database_connect = await dbConnect()
      let collection_connect = database_connect.collection(collections.NEWADMINS_COLLECTION)
collection_connect.deleteOne({_id:new objectId(removeId)})

resolve()
    })
  }

}







