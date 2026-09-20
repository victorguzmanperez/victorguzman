/**
 * Calendly integration facade.
 *
 * Availability and confirmation remain owned by Calendly. The action router
 * opens the canonical booking URL and only a real calendly.event_scheduled
 * signal may confirm a booking.
 */
export {
  bookingKnowledge,
  bookingKnowledgeById,
  getBookingById,
  getBookingFact,
} from "../data/knowledge/bookings.js";
