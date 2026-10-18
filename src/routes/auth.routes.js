
const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/register/traveler", authController.registerTraveler);
router.post("/register/guide", authController.registerGuide);
router.post("/login", authController.login);
router.get("/guides", authController.listGuides);
router.get("/me", authController.me);
router.post("/logout", authController.logout);

module.exports = router;
