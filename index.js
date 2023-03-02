const express = require("express");
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
async function run() {
  try {
    const database = client.db("doctors_portal");
    const servicesCollection = database.collection("services");
    const bookingCollection = database.collection("bookings");
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = await servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/available",async(req,res)=>{
        const date = req.query.date;
        const query={date}
         const bookings = await bookingCollection.find(query).toArray();
         const services = await servicesCollection.find({}).toArray();
         services.forEach(service=>{
            const serviceBookings = bookings.filter( b=> b.treatment === service.name)  
            const booked =  serviceBookings.map(s => s.slot) 
           const available = service.slots.filter(s => !booked.includes(s))
           service.slots=available;
         })
        res.send(services)
    })
    app.get("/booking",async(req,res)=>{
        const patient = req.query.patient;
        const query={patient: patient}
        const bookings = await bookingCollection.find(query).toArray()
        res.send(bookings)
    })
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        patient: booking.patient,
        date: booking.date,
      };
      const exists = await bookingCollection.findOne(query)
      if(exists){
       return res.send({success: false,booking: exists})
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({success: true,result});
    });
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
