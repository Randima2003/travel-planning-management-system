const { z } = require("zod");
const bookingService = require("../services/booking.service");

const activitySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  day: z.coerce.number().int().min(0).max(60),
  time: z.string().max(10),
  duration: z.string().max(30).optional().default(""),
  title: z.string().trim().min(1).max(100),
  desc: z.string().max(500).optional().default(""),
  description: z.string().max(500).optional(),
  location: z.string().max(150).optional().default(""),
  tag: z.string().max(50).optional().default(""),
  cost: z.coerce.number().finite().min(0).max(100000000),
});

const optionalDateSchema = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().date().nullable().optional().default(null)
);

const tripSchema = z.object({
  destination: z.string().trim().min(2).max(150),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  visibility: z.enum(["friends", "private", "public"]).default("friends"),
  budget: z.coerce.number().finite().min(0).max(1000000000).default(0),
  activities: z.array(activitySchema).max(500).default([]),
});

function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const error = new Error("Please check the submitted fields");
    error.status = 400;
    error.details = result.error.flatten().fieldErrors;
    throw error;
  }
  return result.data;
}

async function listTrips(req, res, next) {
  try {
    const trips = await bookingService.listTrips(req.userId);
    return res.json({ success: true, trips });
  } catch (error) { return next(error); }
}

async function createTrip(req, res, next) {
  try {
    const trip = await bookingService.createTrip(req.userId, validate(tripSchema, req.body));
    return res.status(201).json({ success: true, trip });
  } catch (error) { return next(error); }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await bookingService.updateTrip(req.userId, req.params.tripId, validate(tripSchema, req.body));
    return res.json({ success: true, trip });
  } catch (error) { return next(error); }
}

async function listBookings(req, res, next) {
  try {
    const bookings = await bookingService.listBookings(req.userId);
    return res.json({ success: true, bookings });
  } catch (error) { return next(error); }
}

async function createBooking(req, res, next) {
  try {
    const data = validate(z.object({
      guideId: z.coerce.number().int().positive(),
      offeredBudget: z.coerce.number().finite().min(0).max(100000000),
      message: z.string().max(1200).optional().default(""),
    }), req.body);
    const booking = await bookingService.createBooking(req.userId, req.params.tripId, data);
    return res.status(201).json({ success: true, booking });
  } catch (error) { return next(error); }
}

async function updateBooking(req, res, next) {
  try {
    const data = validate(z.object({
      status: z.enum(["accepted", "declined", "countered"]),
      counterOffer: z.coerce.number().finite().positive().max(100000000).optional(),
    }), req.body);
    if (data.status === "countered" && !data.counterOffer) {
      return res.status(400).json({ success: false, message: "Enter a counter offer amount" });
    }
    const booking = await bookingService.updateBooking(req.userId, req.params.bookingId, data);
    req.app.get("io")?.to(`booking:${booking.id}`).emit("booking:updated", booking);
    return res.json({ success: true, booking });
  } catch (error) { return next(error); }
}

async function respondToCounterOffer(req, res, next) {
  try {
    const { status } = validate(z.object({ status: z.enum(["accepted", "declined"]) }), req.body);
    const booking = await bookingService.respondToCounterOffer(req.userId, req.params.bookingId, status);
    req.app.get("io")?.to(`booking:${booking.id}`).emit("booking:updated", booking);
    return res.json({ success: true, booking });
  } catch (error) { return next(error); }
}

async function listMessages(req, res, next) {
  try {
    const messages = await bookingService.listMessages(req.userId, req.params.bookingId);
    return res.json({ success: true, messages });
  } catch (error) { return next(error); }
}

async function createMessage(req, res, next) {
  try {
    const { body } = validate(z.object({ body: z.string().trim().min(1).max(2000) }), req.body);
    const message = await bookingService.createMessage(req.userId, req.params.bookingId, body);
    req.app.get("io")?.to(`booking:${req.params.bookingId}`).emit("booking:message", message);
    return res.status(201).json({ success: true, message });
  } catch (error) { return next(error); }
}

module.exports = {
  listTrips,
  createTrip,
  updateTrip,
  listBookings,
  createBooking,
  updateBooking,
  respondToCounterOffer,
  listMessages,
  createMessage,
};
