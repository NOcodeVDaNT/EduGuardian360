const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://ved_admin:ghost123@cluster0.7plz4s4.mongodb.net/eduguardian360")
.then(async () => {
  console.log("MongoDB Connected. Adding User...");

  const User = mongoose.model("User", {
    child_name: String,
    rfid: String,
    parent_name: String,
    bus_id: String
  });

  const newUser = new User({
    child_name: "Aman Verma", // Example name
    rfid: "F38489F1",
    parent_name: "Mr Verma",
    bus_id: "bus_01"
  });

  await newUser.save();
  console.log("✅ User F38489F1 added successfully!");
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err);
  process.exit(1);
});
