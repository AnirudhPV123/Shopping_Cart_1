var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');

const verifyLogin = (req, res, next) => {  //middleware use to check whether loggedIn or not
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.render('admin/admin-login')
  }
}



/* GET users listing. */
router.get('/', function(req, res, next) {

  res.render('admin/admin-login')

  // productHelpers.getProduct((products) => {

  //   res.render('admin/view-products', { admin: true, products });
  // })
});

router.post('/admin-login',async(req,res)=>{
  
  productHelpers.checkAdmin(req.body,(response)=>{
   
    if(response.status){
      req.session.admin=response.admin
      req.session.adminLoggedIn=true

      masterAdmin=response.masterAdmin

      productHelpers.getProduct((products) => {

        res.render('admin/view-products', { admin: true, products ,admin:req.session.admin,masterAdmin});
      })
      

    }else{
      req.session.adminLoggedInErr="Invalid email or password"
      res.render('admin/admin-login',{"loginErr":req.session.adminLoggedInErr})
    }



  })

})

router.get('/create-new-admin',async(req,res)=>{
  res.render('admin/create-new-admin',{admin:req.session.admin})
})

router.post('/create-new-admin',async(req,res)=>{
  productHelpers.createNewAdmin(req.body).then((response)=>{
    
    if(response=='Admin account already exist'){
      res.render('admin/create-new-admin',{"addErr":response})
    }else{
      res.render('admin/create-new-admin',{admin:req.session.admin})
    }

  })
})

router.get('/admin-logout',(req,res)=>{
  req.session.admin=null
  res.redirect('/admin')
})

router.get('/admin-home',(req,res)=>{
  if(req.session.adminLoggedIn){
    productHelpers.getProduct((products) => {

      res.render('admin/view-products', { admin: true, products ,admin:req.session.admin});
    })
  }
})

router.get('/all-orders',async(req,res)=>{
  // let orders=await productHelpers.getAllOrderDetails()

  await productHelpers.getProductDetails().then((orders)=>{


    res.render('admin/all-orders',{admin:req.session.admin,orders})

  })

  

})

router.get('/all-users',async(req,res)=>{
  productHelpers.getAllUsers().then((users)=>{
    res.render('admin/all-users',{users,admin:req.session.admin})
  })
})

router.get('/all-admins',async(req,res)=>{
  productHelpers.getAllAdmins().then((allAdmins)=>{
    res.render('admin/all-admins',{allAdmins,admin:req.session.admin})
  })
})

router.get('/remove-admins/:id',(req,res)=>{
  productHelpers.removeAdmins(req.params.id).then(()=>{
    res.redirect('/admin/all-admins')
  })
})



router.get('/add-product', function (req, res) {
  res.render('admin/add-product',{admin:req.session.admin})
})

router.post('/add-product', (req, res) => {



  productHelpers.addProduct(req.body, (id) => {
    let image=req.files.Image
        image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (!err) {
        res.redirect('/admin/add-product')

      }
    })


  })
})

router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelpers.deleteProduct(productId).then(async(response)=>{
    res.redirect('/admin/admin-home')



  })
})

 
router.get('/edit-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelpers.productDetails(productId).then((product)=>{
    res.render('admin/edit-product',{product,admin:req.session.admin})
  })
})

router.post('/update-product/:id',(req,res)=>{
  let updateId=req.params.id
  let id=req.params.id

  productHelpers.productUpdate(updateId,req.body).then(()=>{
    res.redirect('/admin/admin-home')

    

    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/' + id + '.jpg', (err) => {
        if (!err) {
          res.render('admin/add-product')
  
        }
      })
      }


   

  })
})

 


module.exports = router;
