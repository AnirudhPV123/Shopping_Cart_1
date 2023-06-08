var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');




/* GET users listing. */
router.get('/', function (req, res, next) {

  productHelpers.getProduct((products) => {

    res.render('admin/view-products', { admin: true, products });
  })
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})

router.post('/add-product', (req, res) => {



  productHelpers.addProduct(req.body, (id) => {
    let image=req.files.Image
        image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (!err) {
        res.render('admin/add-product')

      }
    })


  })
})

router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelpers.deleteProduct(productId).then((response)=>{
    res.redirect('/admin')
  })
})

 
router.get('/edit-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelpers.productDetails(productId).then((product)=>{
    res.render('admin/edit-product',{product})
  })
})

router.post('/update-product/:id',(req,res)=>{
  let updateId=req.params.id
  let id=req.params.id

  productHelpers.productUpdate(updateId,req.body).then(()=>{
    res.redirect('/admin')

    

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
