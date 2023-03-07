const express = require("express");
const jwt = require("jsonwebtoken");
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
//middle ware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
const password = process.env.DB_PASSWORD;
const user = process.env.DB_USER;
const uri = `mongodb+srv://${user}:${password}@cluster0.6jgcl3u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};
async function run() {
  try {
    const database = client.db("doctors_portal");
    const servicesCollection = database.collection("services");
    const bookingCollection = database.collection("bookings");
    const userCollection = database.collection("users");
    const doctorCollection = database.collection("doctors");
   
    const verifyAdmin=async(req,res,next)=>{
      const requester = req.decoded.email;
      const requesterAccount =await userCollection.findOne({email: requester})
  
      if(requesterAccount.role ==='admin'){
        next();
      }
      else{
        res.status(403).send({message: 'forbidden'})
      }
    }
    app.get("/users",verifyJWT, async(req,res)=>{
      const query={}
      const users = await userCollection.find(query).toArray();
      res.send(users);
    })

    app.get("/admin/:email", async(req,res)=>{
      const email = req.params.email;
      const query={email:email}
      const users = await userCollection.findOne(query);
      const isAdmin = users.role==='admin'
      res.send({admin: isAdmin});
    })
    app.put("/user/admin/:email",verifyJWT,verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
        const updatedDoc = {
          $set: {role: 'admin'},
        };
          const result = await userCollection.updateOne(
            filter,
            updatedDoc   
          ); 
          res.send(result);   
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };

      const updatedDoc = {
        $set: user,
      };
      if (user && email) {
        const result = await userCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        const token = jwt.sign(
          { email: email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1hr" }
        );
        res.send({ result, token });
      }
    });
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = await servicesCollection.find(query).project({name: 1});
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/available", async (req, res) => {
      const date = req.query.date;
      const query = { date };
      const bookings = await bookingCollection.find(query).toArray();
      const services = await servicesCollection.find({}).toArray();
      services.forEach((service) => {
        const serviceBookings = bookings.filter(
          (b) => b.treatment === service.name
        );
        const booked = serviceBookings.map((s) => s.slot);
        const available = service.slots.filter((s) => !booked.includes(s));
        service.slots = available;
      });
      res.send(services);
    });
    app.get("/booking", verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      // const authorization = req.headers.authorization;
      // console.log(authorization);
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const query = { patient: patient };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        patient: booking.patient,
        date: booking.date,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({ success: true, result });
    });
    app.get("/doctor",verifyJWT,verifyAdmin,async(req,res)=>{
      const doctors =await doctorCollection.find({}).toArray()
      res.send(doctors)
    })
    app.delete("/doctor/:email",verifyJWT,verifyAdmin, async(req,res)=>{
      const email = req.params.email;
      const filter = {email: email}
      const result = await doctorCollection.deleteOne(filter);
      res.send(result)
    })
    app.post("/doctor",verifyJWT,verifyAdmin, async(req,res)=>{
      const doctor = req.body;
      const result = await doctorCollection.insertOne(doctor);
      res.send(result)
    })
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("doctors-portal Server is running");
});
app.listen(port, () => {
  console.log("Server is running on port", port);
});
