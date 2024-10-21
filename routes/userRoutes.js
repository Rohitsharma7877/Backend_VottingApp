const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const { jwtAuthMiddleware, generateToken } = require("../Middleware/jwt");

// <-----------signup&Login------------->

// POST route to add a person
router.post("/signup", async (req, res) => {
  try {
    const data = req.body; // Assuming the request body contains the User data

    // Check if there is already an admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (data.role === "admin" && adminUser) {
      return res.status(400).json({ error: "Admin user already exists" });
    }

    // Validate Aadhar Card Number must have exactly 12 digit
    if (!/^\d{12}$/.test(data.aadharCardNumber)) {
      return res
        .status(400)
        .json({ error: "Aadhar Card Number must be exactly 12 digits" });
    }

    // Check if a user with the same Aadhar Card Number already exists
    const existingUser = await User.findOne({
      aadharCardNumber: data.aadharCardNumber,
    });
    if (existingUser) {
      return res.status(400).json({
        error: "User with the same Aadhar Card Number already exists",
      });
    }

    // Create a new User document using the Mongoose model
    const newUser = new User(data);

    // Save the new user to the database
    const response = await newUser.save();
    console.log("data saved");

    const payload = {
      id: response.id,
    };
    console.log(JSON.stringify(payload));
    const token = generateToken(payload);

    res.status(200).json({ response: response, token: token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// <------Login------------->
// Login Route
router.post("/login", async (req, res) => {
  try {
    // Extract aadharCardNumber and password from request body
    const { aadharCardNumber, password } = req.body;

    // Check if aadharCardNumber or password is missing
    if (!aadharCardNumber || !password) {
      return res
        .status(400)
        .json({ error: "Aadhar Card Number and password are required" });
    }

    // Find the user by aadharCardNumber
    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    // If user does not exist or password does not match, return error
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ error: "Invalid Aadhar Card Number or Password" });
    }

    // generate Token
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);

    // resturn token as response
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// <-----------signup&Login------------->

// Get List of all users details - only accessible by admin
router.get("/", jwtAuthMiddleware, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const adminUser = await User.findById(adminUserId);

    // Check if the user has the 'admin' role
    if (adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can view this data." });
    }

    // Find all users and select relevant fields (excluding password by not selecting it)
    const users = await User.find(
      {},
      "name age mobile address aadharCardNumber"
    );

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    const userId = userData.id;
    const user = await User.findById(userId);
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT USER update the all details but Aadhar Numbert will not updated
router.put("/profile/update/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extract the user ID from the token
    const {
      name,
      age,
      email,
      mobile,
      address,
      currentPassword,
      newPassword,
      aadharCardNumber,
    } = req.body;

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent updating Aadhar card number
    if (aadharCardNumber && aadharCardNumber !== user.aadharCardNumber) {
      return res
        .status(400)
        .json({ error: "Aadhar card number cannot be updated" });
    }

    // Track if any changes were made
    let changesMade = false;

    // Update profile fields (name, age, email, mobile, address) only if there are changes
    if (name && name !== user.name) {
      user.name = name;
      changesMade = true;
    }
    if (age && age !== user.age) {
      user.age = age;
      changesMade = true;
    }
    if (email && email !== user.email) {
      user.email = email;
      changesMade = true;
    }
    if (mobile && mobile !== user.mobile) {
      user.mobile = mobile;
      changesMade = true;
    }
    if (address && address !== user.address) {
      user.address = address;
      changesMade = true;
    }

    // If the user wants to change their password
    if (currentPassword && newPassword) {
      // Check if the current password matches the stored password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update the password with the new one (hashing will happen automatically)
      user.password = newPassword; // The pre-save hook will handle hashing
      changesMade = true;
    }

    // Save the updated user only if changes were made
    if (changesMade) {
      await user.save();
      return res.status(200).json({
        message: "Profile and/or password updated successfully",
        user,
      });
    } else {
      return res.status(200).json({
        message: "No changes were made, profile is already up to date",
        user,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extract the id from the token
    const { currentPassword, newPassword } = req.body; // Extract current and new passwords from request body

    // Check if currentPassword and newPassword are present in the request body
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both currentPassword and newPassword are required" });
    }

    // Find the user by userID
    const user = await User.findById(userId);

    // If user does not exist or password does not match, return error
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    console.log("password updated");
    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
