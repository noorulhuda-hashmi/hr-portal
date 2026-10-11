// Pehla admin banane ke liye: .env mein ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD likh kar "npm run seed" chalayein
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  const { ADMIN_NAME = "Admin", ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in .env first.");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  if (await User.findOne({ role: "admin" })) {
    console.log("An admin already exists. Nothing to do.");
  } else {
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "admin" });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
