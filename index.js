const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = "mongodb://127.0.0.1:27017";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ydmxw3q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const featureCollection = client
      .db("educodaDB")
      .collection("featureSection");
    const assignmentsCollection = client
      .db("educodaDB")
      .collection("assignments");

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    app.get("/api/features", async (req, res) => {
      const result = await featureCollection.find().toArray();
      res.send(result);
    });
    app.post("/api/create-assignments", async (req, res) => {
      const assignmentsInfo = req.body;
      console.log(assignmentsInfo);
      const result = await assignmentsCollection.insertOne(assignmentsInfo);
      res.send(result);
    });
    app.get("/api/all-assignments", async (req, res) => {
      const result = await assignmentsCollection.find().toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Education is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
