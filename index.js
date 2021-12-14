
// firebase admin 
const { initializeApp } = require('firebase-admin/app');
var admin = require("firebase-admin");
var serviceAccount = require("./online-shop.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
// .env
require('dotenv').config()
const port = 5600



// mongodb 

const { MongoClient, ObjectId } = require('mongodb');
// const { ObjectID } = require('bson')
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.bafft.mongodb.net/onlineShop?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



const app = express()
app.use(cors())
app.use(bodyParser.json())


app.get('/', (req, res) => {
  res.send('Hello World!')
})




// work in Back-End and send and receive data from mongodb database 

client.connect(err => {

  // post product 

  const productCollection = client.db("onlineShop").collection("products");
  const selectedProductCollection = client.db("onlineShop").collection("selectedProducts");

  app.post("/addProduct", (req, res) => {
    productCollection.insertOne(req.body)
      .then(result => {
      })
  })

  // Product Update
  app.patch("/product-update/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    console.log(id, data)
    productCollection.updateOne({_id: ObjectId(id)},{ $set: {pdName:data.pdName , Weight:data.Weight ,price:data.price }})
      .then(result => console.log("result" , result))
      .catch(err => console.log("error" , err));
  })

  // get products 

  app.get("/products", (req, res) => {
    productCollection.find()
      .toArray((err, docs) => {
        res.send(docs);
      })
  })


  // get single product 

  app.get("/productDetails/:id", (req, res) => {
    const pdId = req.params.id
    productCollection.find({ _id: ObjectId(pdId) })
      .toArray((err, docs) => {
        res.send(docs[0])
      })
  })

  // delete single product 

  app.delete(`/delete/:id`, (req, res) => {
    productCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount)
      })
  })


  // seclselectedProductCollection


  // post selected data 
  app.post("/selectedData", (req, res) => {
    selectedProductCollection.insertOne(req.body)
      .then(result => {
      })
  })

  // get some data in email same address 

  app.get("/orders", (req, res) => {
    const queryEmail = req.query.email
    const bearer = req.headers.authorization
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1]
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const jwtEmail = decodedToken.email
          if (queryEmail === jwtEmail) {
            selectedProductCollection.find({ email: queryEmail })
              .toArray((err, docs) => {
                res.send(docs)
              })
          }
          else {
            res.status(401).send("Un-Authorized User")
          }
        })
        .catch((error) => {
          res.status(401).send("Un-Authorized User")
        });
    }
    else {
      res.status(401).send("Un-Authorized User")
    }


  })

});












app.listen(port)
