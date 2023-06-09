var express = require('express');
var userHelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { ObjectId } = require('mongodb');

var router = express.Router();

const verifyLogin = (req, res, next) => {  //middleware use to check whether loggedIn or not
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async(req, res)=>{

  let user = req.session.user

  let cartCount = null

  if (req.session.user) {

    cartCount = await userHelpers.getProductCount(req.session.user._id)
  }


  productHelpers.getProduct((products) => {

    res.render('user/view-products', { products, user, cartCount });

  })




});

router.get('/login', (req, res) => {

  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false

  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {

  userHelpers.doSignup(req.body, (response) => {
    req.session.user = response.user

    req.session.userLoggedIn = true //changed 

    res.redirect('/')
  })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body, (response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true //changed

      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid email or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user=null
  res.redirect('/login')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = 0
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }

  //let user=req.session.user  for easy purpose we pass like the below way

  res.render('user/cart', { products, user: req.session.user, total })



})

router.get('/add-to-cart/:id', (req, res) => {


  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })

})


router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {

    let products = await userHelpers.getCartProductsOrder(req.session.user._id)

    let total=0
if(products.length>0){

    let total = await userHelpers.getTotalAmount(req.session.user._id)
  
    response.total = total
  }
    res.json(response)
  

  })
})

router.get('/place-order', verifyLogin, async (req, res) => {



  let total = await userHelpers.getTotalAmount(req.session.user._id)

  res.render('user/place_order', { total, user: req.session.user })
})


router.post('/place-order', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProductsOrder(req.session.user._id)
  let total = 0
  if (products.length > 0) {

    total = await userHelpers.getTotalAmount(req.session.user._id)
  }


  userHelpers.placeOrder(req.body, products, total).then(async (orderId) => {


    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get('/order-success', verifyLogin, async (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/view-orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getOrderDetails(req.session.user._id)
  res.render('user/view-orders', { user: req.session.user, orders })
})

router.get('/order-view-products/:id', verifyLogin, async (req, res) => {

  let products = await userHelpers.orderViewProducts(req.params.id)

  res.render('user/order-view-products', { user: req.session.user, products })
})


router.post('/verify-payment', (req, res) => {

  console.log(req.body)

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })

})


module.exports = router;
