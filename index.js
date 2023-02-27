const express = require("express")
var cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
//middle ware
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000
const password = process.env.DB_PASSWORD
const user = process.env.DB_USER
const uri = `mongodb+srv://${user}:${password}@cluster0.6jgcl3u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const database = client.db("doctors_portal");
        const servicesCollection = database.collection("services");
        app.get('/services',async(req,res)=>{
                const query ={}
               const  cursor  = await servicesCollection.find(query)
               const services =await cursor.toArray()
               res.send(services)
        })
    }
    
    finally{

    }
}
run().catch(console.dir);
app.get("/",(req,res)=>{
    res.send("doctors-portal Server is running")
})
app.listen(port,()=>{
    console.log("Server is running on port",port)
})