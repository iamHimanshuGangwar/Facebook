const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");


const app = express();
app.use(cors());
app.use(express.json());

// DB + JWT SETUP
const uri = "mongodb+srv://himanshugangwar:himanshu@cluster0.oxmrk95.mongodb.net/";
const secretKey = "secretkey";
const client = new MongoClient(uri);

let db;

// CONNECT DB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("abhi");
    console.log("CONNECTED TO MONGO");
  } catch (err) {
    console.error("DB ERROR:", err);
  }
}
connectDB();
          

// ---------------- AUTH ----------------

// SIGNUP
app.post("/api/signup", async (req, res) => {
  const { firstname, surname, email, password } = req.body;

  const users = db.collection("users");
  const exists = await users.findOne({ email });

  if (exists) return res.json({ message: "User already exists" });

  await users.insertOne({ firstname, surname, email, password });
  res.json({ message: "User Registered Successfully" });
});


// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const users = db.collection("users");
  const user = await users.findOne({ email });

  if (!user) return res.json({ message: "Invalid Email" });
  if (user.password !== password) return res.json({ message: "Invalid Password" });

  const token = jwt.sign({ email }, secretKey);
  res.json({ message: "Success", token });
});

// Update User
app.post("/api/user/edit", async (req, res) => {
  const { email, firstname, surname, password } = req.body;
  const db = client.db("abhi");
  const userCollection = db.collection("users");

  await userCollection.updateOne(
    { email: email },
    { $set: { firstname: firstname, surname: surname, password: password } }
  );

  res.json({ message: "Data Updated" });
});

// Find User
app.post("/api/user/find", async (req, res) => {
  const { email } = req.body;
  const db = client.db("abhi");
  const userCollection = db.collection("users");

  const user = await userCollection.findOne({ email });
  if (user) {
    res.json({ message: "User Found", user });
  } else {
    res.json({ message: "User Not Found" });
  }
});

//  SEND FRIEND REQUEST
app.post("/api/sendRequest", async (req, res) => {
  const db = client.db("abhi");
  const friendsCollection = db.collection("friends");

  let { token, receiver } = req.body;

  // Validate input
  if (!token) {
    return res.json({ error: "Token is required" });
  }
  if (!receiver) {
    return res.json({ error: "Receiver email is required" });
  }

  // ✔ Safe check before startsWith()
  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  // Verify token
  let payload;
  try {
    payload = jwt.verify(token, "secretkey");
  } catch (err) {
    return res.json({ error: "Invalid or expired token" });
  }

  const sender = payload.email;

  if (sender === receiver) {
    return res.json({ error: "You cannot send request to yourself" });
  }

  const status = 0; // pending

  // ✔ Check if request already exists (both directions)
  const existing = await friendsCollection.findOne({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender }
    ]
  });

  if (existing) {
    return res.json({ message: "Friend request already exists" });
  }

  // ✔ Insert friend request
  const result = await friendsCollection.insertOne({
    sender,
    receiver,
    status,
    createdAt: new Date()
  });

  if (!result.insertedId) {
    return res.json({ error: "Failed to send friend request" });
  }

  res.json({ message: "Friend request sent successfully" });
});

// DEBUG TOKEN

app.post("/api/debugToken", (req, res) => {
  let { token } = req.body;

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    let data = jwt.verify(token, "secretkey");
    res.json({ decoded: data });
  } catch (err) {
    res.json({ error: "Invalid token" });
  }
});



// ACCEPT REQUEST
app.post("/api/friends/accept", async (req, res) => {
  let { token, sender } = req.body;

  if (!token || !sender) return res.json({ error: "Token & sender required" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const receiver = payload.email;

  const friends = db.collection("friends");

  const request = await friends.findOne({
    sender,
    receiver,
    status: 0
  });

  if (!request) return res.json({ message: "No pending request" });

  await friends.updateOne({ sender, receiver }, { $set: { status: 1 } });

  res.json({ message: "Friend request accepted" });
});


// REJECT REQUEST
app.post("/api/friends/reject", async (req, res) => {
  let { token, sender } = req.body;

  if (!token || !sender) return res.json({ error: "Token & sender required" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const receiver = payload.email;

  const friends = db.collection("friends");

  const request = await friends.findOne({
    sender,
    receiver,
    status: 0
  });

  if (!request) return res.json({ message: "No pending request" });

  await friends.deleteOne({ sender, receiver });

  res.json({ message: "Friend request rejected" });
});


// CANCEL SENT REQUEST
app.post("/api/friends/cancel", async (req, res) => {
  let { token, receiver } = req.body;
  if (!token || !receiver) return res.json({ error: "Token & receiver required" });

  if (token.startsWith("Bearer ")) token = token.split(" ")[1];
  let payload;

  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const sender = payload.email;
  const friends = db.collection("friends");

  await friends.deleteOne({ sender, receiver, status: 0 });

  res.json({ message: "Friend request cancelled" });
});


// UNFRIEND
app.post("/api/friends/unfriend", async (req, res) => {
  let { token, user } = req.body;

  if (!token || !user) return res.json({ error: "Token & user required" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const myself = payload.email;

  const friends = db.collection("friends");

  await friends.deleteOne({
    $or: [
      { sender: myself, receiver: user, status: 1 },
      { sender: user, receiver: myself, status: 1 }
    ]
  });

  res.json({ message: "Unfriended successfully" });
});


// LIST FRIENDS
app.post("/api/friends/list", async (req, res) => {
  let { token } = req.body;

  if (!token) return res.json({ error: "Token required" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const myEmail = payload.email;

  const friends = db.collection("friends");

  const list = await friends.find({
    status: 1,
    $or: [{ sender: myEmail }, { receiver: myEmail }]
  }).toArray();

  res.json({ friends: list });
});


// LIST PENDING REQUESTS (received + sent)
app.post("/api/friends/pending", async (req, res) => {
  let { token } = req.body;

  if (!token) return res.json({ error: "Token required" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, secretKey);
  } catch {
    return res.json({ error: "Invalid token" });
  }

  const myEmail = payload.email;
  const friends = db.collection("friends");

  const pending = await friends.find({
    status: 0,
    $or: [
      { sender: myEmail },
      { receiver: myEmail }
    ]
  }).toArray();

  res.json({ pending });
});


app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});