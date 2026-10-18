const db = require("../config/db");

async function getTableColumns(table) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(rows.map((row) => row.Field));
}

async function getUser(userId) {
  const userColumns = await getTableColumns("users");
  const nameColumn = userColumns.has("full_name") ? "full_name" : "name";
  const [rows] = await db.execute(
    `SELECT id, role, ${nameColumn} AS full_name FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

function parseJson(value, fallback = []) {
  if (!value) return fallback;
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapTrip(row) {
  const date = (value) => value
    ? (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10))
    : null;
  return {
    id: row.id,
    destination: row.destination,
    startDate: date(row.start_date),
    endDate: date(row.end_date),
    visibility: row.visibility,
    budget: Number(row.budget),
    activities: parseJson(row.activities),
    status: row.status,
    createdAt: row.created_at
  };
}

function mapBooking(row) {
  const startDate = row.start_date
    ? (row.start_date instanceof Date ? row.start_date.toISOString().slice(0, 10) : String(row.start_date).slice(0, 10))
    : null;
  const activities = parseJson(row.activities);
  const itinerary = activities.map((activity) => ({
    time: activity.time || "09:00",
    title: activity.title,
    text: activity.desc || activity.description || activity.location || ""
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
    duration: row.start_date && row.end_date ? `${row.start_date} to ${row.end_date}` : "Dates not set",
    travelers: 1,
    budget: Number(row.counter_offer || row.offered_budget),
    offeredBudget: Number(row.offered_budget),
    counterOffer: row.counter_offer == null ? null : Number(row.counter_offer),
    message: row.request_message,
    status: row.status,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    itinerary,
    createdAt: row.created_at
  };
}

async function listTrips(travelerId) {
  const user = await getUser(travelerId);
  if (!user || user.role !== "traveler") {
    const error = new Error("Traveler account required");
    error.status = 403;
    throw error;
  }
  const [rows] = await db.execute(
    `SELECT id, destination, start_date, end_date, visibility, budget, activities, status, created_at
     FROM traveler_trips WHERE traveler_id = ? ORDER BY created_at DESC, id DESC`,
    [travelerId]
  );
  return rows.map(mapTrip);
}

async function createTrip(travelerId, data) {
  const user = await getUser(travelerId);
  if (!user || user.role !== "traveler") {
    const error = new Error("Traveler account required");
    error.status = 403;
    throw error;
  }
  const [result] = await db.execute(
    `INSERT INTO traveler_trips
      (traveler_id, destination, start_date, end_date, visibility, budget, activities)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [travelerId, data.destination, data.startDate || null, data.endDate || null,
      data.visibility || "friends", data.budget || 0, JSON.stringify(data.activities || [])]
  );
  const [rows] = await db.execute(
    `SELECT id, destination, start_date, end_date, visibility, budget, activities, status, created_at
     FROM traveler_trips WHERE id = ? AND traveler_id = ? LIMIT 1`,
    [result.insertId, travelerId]
  );
  return mapTrip(rows[0]);
}

async function updateTrip(travelerId, tripId, data) {
  const user = await getUser(travelerId);
  if (!user || user.role !== "traveler") {
    const error = new Error("Traveler account required");
    error.status = 403;
    throw error;
  }
  const [result] = await db.execute(
    `UPDATE traveler_trips
     SET destination = ?, start_date = ?, end_date = ?, visibility = ?, budget = ?, activities = ?
     WHERE id = ? AND traveler_id = ?`,
    [data.destination, data.startDate || null, data.endDate || null, data.visibility,
      data.budget, JSON.stringify(data.activities), tripId, travelerId]
  );
  if (!result.affectedRows) {
    const error = new Error("Trip not found");
    error.status = 404;
    throw error;
  }
  const [rows] = await db.execute(
    `SELECT id, destination, start_date, end_date, visibility, budget, activities, status, created_at
     FROM traveler_trips WHERE id = ? AND traveler_id = ? LIMIT 1`,
    [tripId, travelerId]
  );
  return mapTrip(rows[0]);
}

async function listBookings(userId) {
  const users = await getTableColumns("users");
  const nameColumn = users.has("full_name") ? "full_name" : "name";
  const [rows] = await db.execute(
    `SELECT b.id, b.trip_id, b.traveler_id, b.guide_id, b.offered_budget, b.counter_offer,
            b.request_message, b.status, b.created_at, t.destination, t.start_date,
            t.end_date, t.activities, traveler.${nameColumn} AS traveler_name,
            guide.${nameColumn} AS guide_name
     FROM bookings b
     INNER JOIN traveler_trips t ON t.id = b.trip_id
     INNER JOIN users traveler ON traveler.id = b.traveler_id
     INNER JOIN users guide ON guide.id = b.guide_id
     WHERE b.traveler_id = ? OR b.guide_id = ?
     ORDER BY b.created_at DESC, b.id DESC`,
    [userId, userId]
  );
  return rows.map(mapBooking);
}

async function createBooking(userId, tripId, data) {
  const traveler = await getUser(userId);
  if (!traveler || traveler.role !== "traveler") {
    const error = new Error("Traveler account required");
    error.status = 403;
    throw error;
  }
  const [trips] = await db.execute(
    "SELECT id FROM traveler_trips WHERE id = ? AND traveler_id = ? LIMIT 1",
    [tripId, userId]
  );
  if (!trips.length) {
    const error = new Error("Trip not found");
    error.status = 404;
    throw error;
  }
  const guide = await getUser(data.guideId);
  if (!guide || guide.role !== "guide") {
    const error = new Error("Guide account not found");
    error.status = 404;
    throw error;
  }
  const [result] = await db.execute(
    `INSERT INTO bookings (trip_id, traveler_id, guide_id, offered_budget, request_message)
     VALUES (?, ?, ?, ?, ?)`,
    [tripId, userId, data.guideId, data.offeredBudget, data.message || ""]
  );
  const bookings = await listBookings(userId);
  return bookings.find((booking) => booking.id === result.insertId);
}

async function updateBooking(userId, bookingId, data) {
  const user = await getUser(userId);
  if (!user || user.role !== "guide") {
    const error = new Error("Guide account required");
    error.status = 403;
    throw error;
  }
  const [result] = await db.execute(
    `UPDATE bookings SET status = ?, counter_offer = ?
     WHERE id = ? AND guide_id = ? AND status IN ('pending', 'countered')`,
    [data.status, data.status === "countered" ? data.counterOffer : null, bookingId, userId]
  );
  if (!result.affectedRows) {
    const error = new Error("Booking not found or already resolved");
    error.status = 404;
    throw error;
  }
  const bookings = await listBookings(userId);
  return bookings.find((booking) => booking.id === Number(bookingId));
}

async function respondToCounterOffer(userId, bookingId, status) {
  const user = await getUser(userId);
  if (!user || user.role !== "traveler") {
    const error = new Error("Traveler account required");
    error.status = 403;
    throw error;
  }
  const [result] = await db.execute(
    `UPDATE bookings SET status = ?
     WHERE id = ? AND traveler_id = ? AND status = 'countered'`,
    [status, bookingId, userId]
  );
  if (!result.affectedRows) {
    const error = new Error("Counteroffer not found or already answered");
    error.status = 404;
    throw error;
  }
  const bookings = await listBookings(userId);
  return bookings.find((booking) => booking.id === Number(bookingId));
}

async function canAccessBooking(userId, bookingId) {
  const [rows] = await db.execute(
    "SELECT id FROM bookings WHERE id = ? AND (traveler_id = ? OR guide_id = ?) LIMIT 1",
    [bookingId, userId, userId]
  );
  return rows.length > 0;
}

async function listMessages(userId, bookingId) {
  if (!(await canAccessBooking(userId, bookingId))) {
    const error = new Error("Booking not found");
    error.status = 404;
    throw error;
  }
  const [rows] = await db.execute(
    `SELECT m.id, m.booking_id, m.sender_id, m.body, m.created_at,
            u.full_name AS sender_name, u.role AS sender_role
     FROM booking_messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.booking_id = ? ORDER BY m.id ASC`,
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
    const error = new Error("Booking not found");
    error.status = 404;
    throw error;
  }
  const [result] = await db.execute(
    "INSERT INTO booking_messages (booking_id, sender_id, body) VALUES (?, ?, ?)",
    [bookingId, userId, body]
  );
  const [rows] = await db.execute(
    `SELECT m.id, m.booking_id, m.sender_id, m.body, m.created_at,
            u.full_name AS sender_name, u.role AS sender_role
     FROM booking_messages m INNER JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
    [result.insertId]
  );
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
