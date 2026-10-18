const db = require("../config/db");

// --------------------------------------------------
// Common helpers
// --------------------------------------------------

function httpError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getTableColumns(table) {
  // Only allow known SQL identifier characters.
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    throw new Error("Invalid table name");
  }

  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\``);

  return new Set(rows.map((row) => row.Field));
}

async function getUserNameColumn() {
  const columns = await getTableColumns("users");

  if (columns.has("full_name")) return "full_name";
  if (columns.has("name")) return "name";

  throw new Error(
    "The users table needs a full_name or name column."
  );
}

async function getUser(userId) {
  const userColumns = await getTableColumns("users");
  const nameColumn = await getUserNameColumn();

  if (
    !userColumns.has("id") ||
    !userColumns.has("role")
  ) {
    throw new Error(
      "The users table must contain id and role columns."
    );
  }

  const [rows] = await db.execute(
    `SELECT id, role, \`${nameColumn}\` AS full_name
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

function isRole(user, expectedRole) {
  return (
    user &&
    String(user.role).toLowerCase() === expectedRole
  );
}

function parseJson(value, fallback = []) {
  if (value == null || value === "") {
    return fallback;
  }

  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : value;

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

// --------------------------------------------------
// Map database rows to API responses
// --------------------------------------------------

function mapTrip(row) {
  return {
    id: row.id,
    destination: row.destination,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    visibility: row.visibility,
    budget: Number(row.budget || 0),
    activities: parseJson(row.activities),
    status: row.status,
    createdAt: row.created_at
  };
}

function mapBooking(row) {
  const startDate = formatDate(row.start_date);
  const endDate = formatDate(row.end_date);

  const activities = parseJson(row.activities);

  const itinerary = activities.map((activity) => ({
    time: activity.time || "09:00",
    title: activity.title || activity.name || "Activity",
    text:
      activity.desc ||
      activity.description ||
      activity.location ||
      ""
  }));

  return {
    id: row.id,
    tripId: row.trip_id,
    travelerId: row.traveler_id,
    guideId: row.guide_id,

    traveler: row.traveler_name,
    guide: row.guide_name,

    title: row.destination,
    destination: row.destination,
    location: row.destination,

    date: startDate || "Dates not set",
    dateLong: startDate || "Dates not set",

    duration:
      startDate && endDate
        ? `${startDate} to ${endDate}`
        : "Dates not set",

    travelers: 1,

    budget: Number(
      row.counter_offer ?? row.offered_budget ?? 0
    ),

    offeredBudget: Number(row.offered_budget || 0),

    counterOffer:
      row.counter_offer == null
        ? null
        : Number(row.counter_offer),

    message: row.request_message || "",
    status: row.status,

    image:
      "https://images.unsplash.com/photo-150053085085?auto=format&fit=crop&w=900&q=80",

    itinerary,
    createdAt: row.created_at
  };
}

// --------------------------------------------------
// Traveler trips
// --------------------------------------------------

async function listTrips(travelerId) {
  const user = await getUser(travelerId);

  if (!isRole(user, "traveler")) {
    throw httpError("Traveler account required", 403);
  }

  const [rows] = await db.execute(
    `SELECT
        id,
        destination,
        start_date,
        end_date,
        visibility,
        budget,
        activities,
        status,
        created_at
     FROM traveler_trips
     WHERE traveler_id = ?
     ORDER BY created_at DESC, id DESC`,
    [travelerId]
  );

  return rows.map(mapTrip);
}

async function createTrip(travelerId, data) {
  const user = await getUser(travelerId);

  if (!isRole(user, "traveler")) {
    throw httpError("Traveler account required", 403);
  }

  if (!data || !String(data.destination || "").trim()) {
    throw httpError("Trip destination is required", 400);
  }

  const budget = Number(data.budget ?? 0);

  if (!Number.isFinite(budget) || budget < 0) {
    throw httpError("Invalid trip budget", 400);
  }

  const activities = Array.isArray(data.activities)
    ? data.activities
    : [];

  const [result] = await db.execute(
    `INSERT INTO traveler_trips
      (
        traveler_id,
        destination,
        start_date,
        end_date,
        visibility,
        budget,
        activities
      )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      travelerId,
      String(data.destination).trim(),
      data.startDate || null,
      data.endDate || null,
      data.visibility || "friends",
      budget,
      JSON.stringify(activities)
    ]
  );

  const [rows] = await db.execute(
    `SELECT
        id,
        destination,
        start_date,
        end_date,
        visibility,
        budget,
        activities,
        status,
        created_at
     FROM traveler_trips
     WHERE id = ? AND traveler_id = ?
     LIMIT 1`,
    [result.insertId, travelerId]
  );

  if (!rows.length) {
    throw new Error("Trip was created but could not be loaded.");
  }

  return mapTrip(rows[0]);
}

async function updateTrip(travelerId, tripId, data) {
  const user = await getUser(travelerId);

  if (!isRole(user, "traveler")) {
    throw httpError("Traveler account required", 403);
  }

  if (!data || !String(data.destination || "").trim()) {
    throw httpError("Trip destination is required", 400);
  }

  const budget = Number(data.budget ?? 0);

  if (!Number.isFinite(budget) || budget < 0) {
    throw httpError("Invalid trip budget", 400);
  }

  const activities = Array.isArray(data.activities)
    ? data.activities
    : [];

  const [result] = await db.execute(
    `UPDATE traveler_trips
     SET
        destination = ?,
        start_date = ?,
        end_date = ?,
        visibility = ?,
        budget = ?,
        activities = ?
     WHERE id = ? AND traveler_id = ?`,
    [
      String(data.destination).trim(),
      data.startDate || null,
      data.endDate || null,
      data.visibility || "friends",
      budget,
      JSON.stringify(activities),
      tripId,
      travelerId
    ]
  );

  if (!result.affectedRows) {
    throw httpError("Trip not found", 404);
  }

  const [rows] = await db.execute(
    `SELECT
        id,
        destination,
        start_date,
        end_date,
        visibility,
        budget,
        activities,
        status,
        created_at
     FROM traveler_trips
     WHERE id = ? AND traveler_id = ?
     LIMIT 1`,
    [tripId, travelerId]
  );

  if (!rows.length) {
    throw httpError("Trip not found", 404);
  }

  return mapTrip(rows[0]);
}

// --------------------------------------------------
// List bookings for traveler or guide dashboards
// --------------------------------------------------

async function listBookings(userId) {
  const nameColumn = await getUserNameColumn();

  const [rows] = await db.execute(
    `SELECT
        b.id,
        b.trip_id,
        b.traveler_id,
        b.guide_id,
        b.offered_budget,
        b.counter_offer,
        b.request_message,
        b.status,
        b.created_at,

        t.destination,
        t.start_date,
        t.end_date,
        t.activities,

        traveler.\`${nameColumn}\` AS traveler_name,
        guide.\`${nameColumn}\` AS guide_name

     FROM bookings b

     INNER JOIN traveler_trips t
       ON t.id = b.trip_id

     INNER JOIN users traveler
       ON traveler.id = b.traveler_id

     INNER JOIN users guide
       ON guide.id = b.guide_id

     WHERE
       b.traveler_id = ?
       OR b.guide_id = ?

     ORDER BY b.created_at DESC, b.id DESC`,
    [userId, userId]
  );

  return rows.map(mapBooking);
}

// --------------------------------------------------
// Create a guide booking/request
// --------------------------------------------------

async function createBooking(userId, tripId, data) {
  const numericUserId = Number(userId);
  const numericTripId = Number(tripId);
  const numericGuideId = Number(data?.guideId);
  const offeredBudget = Number(data?.offeredBudget);

  if (
    !Number.isInteger(numericUserId) ||
    numericUserId <= 0 ||
    !Number.isInteger(numericTripId) ||
    numericTripId <= 0 ||
    !Number.isInteger(numericGuideId) ||
    numericGuideId <= 0
  ) {
    throw httpError(
      "Valid traveler, trip and guide IDs are required",
      400
    );
  }

  if (
    !Number.isFinite(offeredBudget) ||
    offeredBudget < 0
  ) {
    throw httpError("Invalid offered budget", 400);
  }

  const traveler = await getUser(numericUserId);

  if (!isRole(traveler, "traveler")) {
    throw httpError("Traveler account required", 403);
  }

  // Make sure the trip belongs to this traveler.
  const [trips] = await db.execute(
    `SELECT id
     FROM traveler_trips
     WHERE id = ? AND traveler_id = ?
     LIMIT 1`,
    [numericTripId, numericUserId]
  );

  if (!trips.length) {
    throw httpError("Trip not found", 404);
  }

  // Make sure the selected user is actually a guide.
  const guide = await getUser(numericGuideId);

  if (!isRole(guide, "guide")) {
    throw httpError("Guide account not found", 404);
  }

  const message = String(data?.message || "").trim();

  console.log("Creating booking:", {
    tripId: numericTripId,
    userId: numericUserId,
    guideId: numericGuideId,
    offeredBudget,
    message
  });

  // The bookings table must exist in the venturevista database.
  const [result] = await db.execute(
    `INSERT INTO bookings
       (
         trip_id,
         traveler_id,
         guide_id,
         offered_budget,
         request_message
       )
     VALUES (?, ?, ?, ?, ?)`,
    [
      numericTripId,
      numericUserId,
      numericGuideId,
      offeredBudget,
      message
    ]
  );

  // Return the newly created booking for the frontend.
  const bookings = await listBookings(numericUserId);

  const createdBooking = bookings.find(
    (booking) => Number(booking.id) === Number(result.insertId)
  );

  if (!createdBooking) {
    throw new Error(
      "Booking was created but could not be loaded."
    );
  }

  return createdBooking;
}

// --------------------------------------------------
// Guide responds to a booking
// --------------------------------------------------

async function updateBooking(userId, bookingId, data) {
  const user = await getUser(userId);

  if (!isRole(user, "guide")) {
    throw httpError("Guide account required", 403);
  }

  const status = String(data?.status || "").toLowerCase();

  if (!["countered", "accepted", "rejected"].includes(status)) {
    throw httpError(
      "Status must be countered, accepted or rejected",
      400
    );
  }

  let counterOffer = null;

  if (status === "countered") {
    counterOffer = Number(data.counterOffer);

    if (
      !Number.isFinite(counterOffer) ||
      counterOffer < 0
    ) {
      throw httpError("A valid counter offer is required", 400);
    }
  }

  const [result] = await db.execute(
    `UPDATE bookings
     SET status = ?, counter_offer = ?
     WHERE id = ?
       AND guide_id = ?
       AND status IN ('pending', 'countered')`,
    [status, counterOffer, bookingId, userId]
  );

  if (!result.affectedRows) {
    throw httpError(
      "Booking not found or already resolved",
      404
    );
  }

  const bookings = await listBookings(userId);

  return (
    bookings.find(
      (booking) => Number(booking.id) === Number(bookingId)
    ) || null
  );
}

// --------------------------------------------------
// Traveler responds to a counter offer
// --------------------------------------------------

async function respondToCounterOffer(userId, bookingId, status) {
  const user = await getUser(userId);

  if (!isRole(user, "traveler")) {
    throw httpError("Traveler account required", 403);
  }

  const responseStatus = String(status || "").toLowerCase();

  if (!["accepted", "rejected"].includes(responseStatus)) {
    throw httpError(
      "Status must be accepted or rejected",
      400
    );
  }

  const [result] = await db.execute(
    `UPDATE bookings
     SET status = ?
     WHERE id = ?
       AND traveler_id = ?
       AND status = 'countered'`,
    [responseStatus, bookingId, userId]
  );

  if (!result.affectedRows) {
    throw httpError(
      "Counteroffer not found or already answered",
      404
    );
  }

  const bookings = await listBookings(userId);

  return (
    bookings.find(
      (booking) => Number(booking.id) === Number(bookingId)
    ) || null
  );
}

// --------------------------------------------------
// Booking access and messaging
// --------------------------------------------------

async function canAccessBooking(userId, bookingId) {
  const [rows] = await db.execute(
    `SELECT id
     FROM bookings
     WHERE id = ?
       AND (traveler_id = ? OR guide_id = ?)
     LIMIT 1`,
    [bookingId, userId, userId]
  );

  return rows.length > 0;
}

async function listMessages(userId, bookingId) {
  if (!(await canAccessBooking(userId, bookingId))) {
    throw httpError("Booking not found", 404);
  }

  const nameColumn = await getUserNameColumn();

  const [rows] = await db.execute(
    `SELECT
        m.id,
        m.booking_id,
        m.sender_id,
        m.body,
        m.created_at,
        u.\`${nameColumn}\` AS sender_name,
        u.role AS sender_role

     FROM booking_messages m

     INNER JOIN users u
       ON u.id = m.sender_id

     WHERE m.booking_id = ?

     ORDER BY m.id ASC`,
    [bookingId]
  );

  return rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at
  }));
}

async function createMessage(userId, bookingId, body) {
  if (!(await canAccessBooking(userId, bookingId))) {
    throw httpError("Booking not found", 404);
  }

  const messageBody = String(body || "").trim();

  if (!messageBody) {
    throw httpError("Message cannot be empty", 400);
  }

  const [result] = await db.execute(
    `INSERT INTO booking_messages
       (booking_id, sender_id, body)
     VALUES (?, ?, ?)`,
    [bookingId, userId, messageBody]
  );

  const nameColumn = await getUserNameColumn();

  const [rows] = await db.execute(
    `SELECT
        m.id,
        m.booking_id,
        m.sender_id,
        m.body,
        m.created_at,
        u.\`${nameColumn}\` AS sender_name,
        u.role AS sender_role

     FROM booking_messages m

     INNER JOIN users u
       ON u.id = m.sender_id

     WHERE m.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  if (!rows.length) {
    throw new Error("Message was created but could not be loaded.");
  }

  const row = rows[0];

  return {
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at
  };
}

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
  listTrips,
  createTrip,
  updateTrip,
  listBookings,
  createBooking,
  updateBooking,
  respondToCounterOffer,
  canAccessBooking,
  listMessages,
  createMessage
};