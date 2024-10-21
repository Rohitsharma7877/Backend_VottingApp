const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  aadharCardNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["voter", "admin"],
    default: "voter",
  },
  isVoted: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  const person = this;
  // hash the password only if it has been modified (or is new)
  if (!person.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // hash password generation
    const hashedPassword = await bcrypt.hash(person.password, salt); // hash password
    person.password = hashedPassword; // Update the password with the hashed version
    next();
  } catch (err) {
    return next(err);
  }
});

// How hash work?
// password - rohit----> jhsbjsahdjsahajsvdalkdg +salt
// enter wrong password --> sharma
// ( jhsbjsahdjsahajsvdalkdg) ----> extract salt
// salt + sharma ----> hash ---> wewiiwiiwiueruiiwu
// compare this (wewiiwiiwiueruiiwu) or this is correct (jhsbjsahdjsahajsvdalkdg)

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (err) {
    throw err;
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
