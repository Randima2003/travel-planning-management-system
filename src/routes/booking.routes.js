const express = require("express");
const controller = require("../controllers/booking.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(requireAuth);
router.get("/trips", controller.listTrips);
router.post("/trips", controller.createTrip);
router.patch("/trips/:tripId", controller.updateTrip);
router.get("/bookings", controller.listBookings);
router.post("/trips/:tripId/bookings", controller.createBooking);
router.patch("/bookings/:bookingId", controller.updateBooking);
router.patch("/bookings/:bookingId/respond", controller.respondToCounterOffer);
router.get("/bookings/:bookingId/messages", controller.listMessages);
router.post("/bookings/:bookingId/messages", controller.createMessage);

module.exports = router;
