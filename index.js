const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const secret = process.env.DB_TOKEN;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fanciful-dango-1d1745.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = "mongodb://127.0.0.1:27017";
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

//getman
const gateman = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "NOT AUTHORIZED" });
  }
  jwt.verify(token, secret, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "NOT AUTHORIZED" });
    }
    // console.log(decoded);
    req.user = decoded;

    next();
  });
};

async function run() {
  try {
    const featureCollection = client
      .db("educodaDB")
      .collection("featureSection");
    const assignmentsCollection = client
      .db("educodaDB")
      .collection("assignments");
    const submittedassignmentsCollection = client
      .db("educodaDB")
      .collection("submittedAssignment");
    const markedassignmentsCollection = client
      .db("educodaDB")
      .collection("markedAssignment");

    // Connect the client to the server	(optional starting in v4.7)
    //middlewares
    // verify token

    // JWT
    app.post("/api/auth/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, secret, {
        expiresIn: "1h",
      });
      // console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    app.post("/api/user/logout", async (req, res) => {
      const user = req.body;
      // console.log("logging out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ succsess: true });
    });
    // await client.connect();

    app.get("/api/features", async (req, res) => {
      const result = await featureCollection.find().toArray();
      res.send(result);
    });
    app.post("/api/create-assignments", async (req, res) => {
      const assignmentsInfo = req.body;
      // console.log(assignmentsInfo);
      const result = await assignmentsCollection.insertOne(assignmentsInfo);
      res.send(result);
    });

    // http://localhost:5000/api/all-assignments?limit=3&page=2
    app.get("/api/all-assignments", async (req, res) => {
      const diffiFromUI = req.query?.difficulty;
      // console.log(req.query); // Corrected query parameter name

      const page = Number(req.query?.page);
      const limit = Number(req.query?.limit);
      const skip = (page - 1) * limit;

      let sortObj = {};
      let filter = {};

      if (diffiFromUI) {
        filter = { difficulty: diffiFromUI };
      }
      const result = await assignmentsCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
      const count = await assignmentsCollection.countDocuments(filter);
      res.send({ result, count });
      // res.send(result);
    });
    // app.get("/productsCount", async(req,res)=>{
    //   const count = await
    // });
    app.get("/api/view-assignments/:id", gateman, async (req, res) => {
      const id = req.params.id; // Corrected parameter name
      const filter = { _id: new ObjectId(id) }; // Assuming you're using MongoDB ObjectId

      const result = await assignmentsCollection.findOne(filter);
      res.send(result);
    });
    app.get("/api/updated-assignments/:id", gateman, async (req, res) => {
      const id = req.params.id; // Corrected parameter name
      const filter = { _id: new ObjectId(id) }; // Assuming you're using MongoDB ObjectId

      const result = await assignmentsCollection.findOne(filter);
      res.send(result);
    });
    app.put("/api/updated-my-assignments/:id", gateman, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }; // Assuming you're using MongoDB ObjectId
      const updateDoc = req.body;
      const result = await assignmentsCollection.updateOne(filter, {
        $set: updateDoc,
      });

      res.send(result);
    });

    //submited assimengt
    app.get(
      "/api/user/all-submitted-assignments",
      gateman,

      async (req, res) => {
        // const assignmentsInfo = req.body;
        // console.log(assignmentsInfo);
        // const emailFromUI = req.query?.email; // Corrected query parameter name
        // console.log(emailFromUI);
        const filter = { status: "pending" };

        const result = await submittedassignmentsCollection
          .find(filter)
          .toArray();
        res.send(result);
      }
    );
    //my assingment

    // app.get(
    //   "/api/user/my-submitted-assignments",
    //   gateman,
    //   async (req, res) => {
    //     // const assignmentsInfo = req.body;

    //     const myAssingment = req.query?.examineeEmail; // Corrected query parameter name
    //     // console.log(myAssingment, req.user);
    //     if (req.user.email !== myAssignment) {
    //       return res.status(403).send({ message: "FORBIDDEN ACCESS" });
    //     }

    //     // return res.status(403).send({ message: "FORBIDDEN ACCESS" });
    //     const filter = { examineeEmail: myAssingment };

    //     const result = await submittedassignmentsCollection
    //       .find(filter)
    //       .toArray();
    //     res.send(result);
    //   }
    app.get("/api/user/my-submitted-assignments", gateman, async (req, res) => {
      const myAssignment = req.query?.examineeEmail;

      if (req.user.user !== myAssignment) {
        return res.status(403).send({ message: "FORBIDDEN ACCESS" });
      }
      // console.log(req.user.user !== myAssignment);

      const filter = { examineeEmail: myAssignment };
      const result = await submittedassignmentsCollection
        .find(filter)
        .toArray();
      res.send(result);
    });

    // console.log(assignmentsInfo);
    // const filter = { status: "pending" };

    // const result = await submittedassignmentsCollection
    //   .find(filter)
    //   .toArray();
    // res.send(result);
    // );

    app.post("/api/user/submitted-assignments", gateman, async (req, res) => {
      const assignmentsInfo = req.body;
      // console.log(assignmentsInfo);
      const result = await submittedassignmentsCollection.insertOne(
        assignmentsInfo
      );
      res.send(result);
    });
    app.delete("/api/delete-my-assignments/:id", gateman, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }; // Assuming you're using MongoDB ObjectId

      const result = await assignmentsCollection.deleteOne(filter);

      res.send(result);
    });

    // mark assingment

    app.put("/api/user/marked-assignments/:id", gateman, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }; // Assuming you're using MongoDB ObjectId
      const updateDoc = req.body;
      // console.log(id, updateDoc);
      const options = { upsert: true };
      const result = await submittedassignmentsCollection.updateOne(
        filter,
        {
          $set: updateDoc,
        },
        options
      );

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
