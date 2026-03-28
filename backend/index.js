const express = require("express");
const mongoose = require("mongoose");

const app = express();

// ---------------- DATABASE CONNECTION ----------------

mongoose.connect("mongodb+srv://ved_admin:ghost123@cluster0.7plz4s4.mongodb.net/eduguardian360")
.then(() => {
  console.log("MongoDB Connected ✅");

  // 🔥 START SERVER ONLY AFTER DB CONNECTS
  app.listen(3000, () => {
    console.log("Server running on port 3000 🚀");
  });

})
.catch(err => console.log("DB Error ❌", err));


// ---------------- BASIC SERVER TEST ----------------

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});


// ---------------- USER MODEL ----------------

const User = mongoose.model("User", {
  child_name: String,
  rfid: String,
  parent_name: String,
  bus_id: String
});


// ---------------- GET ALL USERS ----------------

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- RFID SCAN ----------------

app.get("/scan/:rfid", async (req, res) => {
  try {
    const user = await User.findOne({ rfid: req.params.rfid });

    if (!user) return res.json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- BUS MODEL ----------------

const Bus = mongoose.model("Bus", {
  bus_id: String,
  bus_number: String,
  driver_name: String,
  driver_phone: String
});

// ---------------- GET DRIVER INFO FOR PARENT ----------------

app.get("/driver-info/:parent_name", async (req, res) => {
  try {
    // 1. Find the child document associated with this parent
    const user = await User.findOne({ parent_name: req.params.parent_name });
    
    if (!user) return res.json({ message: "Parent not found in database" });

    // 2. Find the specific bus assigned to their child
    const bus = await Bus.findOne({ bus_id: user.bus_id });

    if (!bus) return res.json({ message: "No bus assigned to this child yet" });

    // 3. Return only exactly what the parent needs to see
    res.json({
      child_name: user.child_name,
      bus_number: bus.bus_number,
      driver_name: bus.driver_name,
      driver_phone: bus.driver_phone
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- LOCATION MODEL ----------------

const Location = mongoose.model("Location", {
  bus_id: String,
  lat: Number,
  lng: Number,
  status: String
});


// ---------------- TRACK ----------------

app.get("/track/:rfid", async (req, res) => {
  try {
    const user = await User.findOne({ rfid: req.params.rfid });

    if (!user) return res.json({ message: "User not found" });

    const bus = await Bus.findOne({ bus_id: user.bus_id });
    const location = await Location.findOne({ bus_id: user.bus_id });

    res.json({
      child: user.child_name,
      parent: user.parent_name,
      bus,
      location
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- UPDATE LOCATION ----------------

app.get("/update-location", async (req, res) => {
  try {
    await Location.updateOne(
      { bus_id: "bus_01" },
      {
        lat: 23.30 + Math.random(),
        lng: 77.40 + Math.random(),
        status: "moving"
      }
    );

    res.send("Location updated 🚀");
  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- SOS MODEL ----------------

const SOS = mongoose.model("SOS", {
  bus_id: String,
  message: String,
  time: String,
  status: String
});


// ---------------- SOS TRIGGER ----------------

app.get("/sos/:bus_id", async (req, res) => {
  try {
    const bus_id = req.params.bus_id;

    const sos = new SOS({
      bus_id,
      message: "Emergency Button Pressed!",
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      status: "active"
    });

    await sos.save();

    const users = await User.find({ bus_id });

    const parents = users.map(u => ({
      child: u.child_name,
      parent: u.parent_name
    }));

    res.json({
      alert: "SOS Broadcasted 🚨",
      bus_id,
      notified_parents: parents
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- GET SOS ----------------

app.get("/sos", async (req, res) => {
  try {
    const alerts = await SOS.find({ status: "active" });
    res.json(alerts);
  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- ATTENDANCE ----------------

const Attendance = mongoose.model("Attendance", {
  rfid: String,
  child_name: String,
  bus_id: String,
  status: String,
  time: String
});


app.get("/scan-entry/:rfid", async (req, res) => {
  try {
    const user = await User.findOne({ rfid: req.params.rfid });

    if (!user) return res.json({ message: "User not found" });

    const last = await Attendance.findOne({ rfid: req.params.rfid }).sort({ time: -1 });

    let newStatus = "IN";
    if (last && last.status === "IN") newStatus = "OUT";

    const record = new Attendance({
      rfid: req.params.rfid,
      child_name: user.child_name,
      bus_id: user.bus_id,
      status: newStatus,
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    });

    await record.save();

    res.json({
      message: "Attendance recorded",
      child: user.child_name,
      status: newStatus,
      time: record.time
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ---------------- GET ATTENDANCE ----------------

app.get("/attendance", async (req, res) => {
  try {
    const data = await Attendance.find().sort({ time: -1 });
    res.json(data);
  } catch (err) {
    res.json({ error: err.message });
  }
});