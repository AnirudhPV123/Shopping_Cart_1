const {MongoClient}=require('mongodb')
const url='mongodb://127.0.0.1:27017'
const databaseName='shopping_cart'
const client=new MongoClient(url)

async function dbConnect(){

    let result=await client.connect();
    return result.db(databaseName)
}

module.exports=dbConnect;