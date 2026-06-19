require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const Seat = require('../src/models/Seat');
const Reservation = require('../src/models/Reservation');
const Booking = require('../src/models/Booking');

const usersSeed = [
  { name: 'Demo Visitor', email: 'demo@example.com', password: 'password123' },
  { name: 'Sarah Jenkins', email: 'sarah.j@example.com', password: 'password123' },
  { name: 'Michael Chen', email: 'm.chen@example.com', password: 'password123' },
  { name: 'Elena Rostova', email: 'elena.r@example.com', password: 'password123' },
  { name: 'David Kim', email: 'd.kim@example.com', password: 'password123' },
  { name: 'Aisha Yusuf', email: 'aisha.y@example.com', password: 'password123' },
  { name: 'Liam O\'Connor', email: 'liam.o@example.com', password: 'password123' },
  { name: 'Sofia Rodriguez', email: 'sofia.r@example.com', password: 'password123' },
  { name: 'Marcus Aurelius', email: 'marcus@example.com', password: 'password123' },
  { name: 'Chloe Dubois', email: 'chloe.d@example.com', password: 'password123' },
  { name: 'Kenji Sato', email: 'kenji.s@example.com', password: 'password123' },
];

const eventsSeed = [
  {
    name: 'Tech Pioneers Conference 2026',
    description: 'Join industry leaders as they discuss the future of AI, quantum computing, and decentralized applications. Featuring keynote sessions, hands-on workshops, and networking.',
    dateTime: new Date('2026-09-15T09:00:00.000Z'),
    venue: 'Silicon Valley Hall, San Jose',
    totalSeats: 60,
    posterUrl: '/assets/tech_pioneers_poster.png',
  },
  {
    name: 'Symphonic Echoes Concert',
    description: 'An evening of breathtaking classical arrangements performed by the Royal Chamber Orchestra. Experience the timeless masterpieces of Beethoven, Mozart, and modern neoclassical composers.',
    dateTime: new Date('2026-10-05T19:30:00.000Z'),
    venue: 'Metropolitan Symphony Hall, New York',
    totalSeats: 60,
    posterUrl: '/assets/symphonic_echoes_poster.png',
  },
  {
    name: 'Modern Design Summit 2026',
    description: 'A gathering for product designers, UX researchers, and creative directors. Discover the latest design methodologies, design systems, and visual communication strategies.',
    dateTime: new Date('2026-11-20T10:00:00.000Z'),
    venue: 'Design Center East, London',
    totalSeats: 60,
    posterUrl: '/assets/design_summit_poster.png',
  },
  {
    name: 'Global AI Startup Summit',
    description: 'The ultimate gathering for AI founders, venture capitalists, and deeptech researchers. Connect, pitch, and build the future. This event features live pitch rounds, seed funding match-making, and deep dives into generative foundations. Bring your pitch decks and network with tier-1 investors.',
    dateTime: new Date('2026-10-12T10:00:00.000Z'),
    venue: 'Innovation Hub, Tokyo',
    totalSeats: 60,
    posterUrl: '/assets/tech_pioneers_poster.png',
  },
  {
    name: 'Acoustic Sunset Session',
    description: 'An intimate, open-air acoustic concert on the Malibu coast. Watch the sunset while listening to raw, soulful performances by local artists.',
    dateTime: new Date('2026-08-25T18:00:00.000Z'),
    venue: 'Ocean Amphitheatre, Malibu',
    totalSeats: 60,
    posterUrl: '/assets/symphonic_echoes_poster.png',
  },
  {
    name: 'Nordic Culinary Expo',
    description: 'Discover the best of Scandinavian cuisine. Meet Michelin-star chefs, experience live cooking demonstrations, and taste traditional and modern dishes sourced from pure Nordic ingredients. Includes workshops on sustainable sourcing, foraging masterclasses, and an artisan food market featuring regional delicacies.',
    dateTime: new Date('2026-07-30T11:00:00.000Z'),
    venue: 'Food Plaza, Oslo',
    totalSeats: 60,
    posterUrl: '/assets/design_summit_poster.png',
  },
  {
    name: 'Web3 Hackathon 2025 (Ended)',
    description: 'A global virtual and in-person hackathon focused on building next-generation decentralized protocols, smart contracts, and zero-knowledge tools. This event is now completed.',
    dateTime: new Date('2025-12-15T09:00:00.000Z'),
    venue: 'Cryptospace, Zug',
    totalSeats: 60,
    posterUrl: '/assets/tech_pioneers_poster.png',
  },
  {
    name: 'Global Design Expo 2026 (Ended)',
    description: 'An exhibition displaying revolutionary works of spatial, industrial, and product design. Visited by over 20,000 design enthusiasts from across the globe.',
    dateTime: new Date('2026-05-10T10:00:00.000Z'),
    venue: 'Palais de Festivals, Cannes',
    totalSeats: 60,
    posterUrl: '/assets/design_summit_poster.png',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    await Reservation.deleteMany({});
    console.log('Wiped User, Event, Seat, Booking, and Reservation collections.');

    // Seed Users
    // We use a loop and User.create to ensure the pre-save bcrypt hook triggers for passwords
    const createdUsers = [];
    for (const u of usersSeed) {
      const userObj = await User.create(u);
      createdUsers.push(userObj);
    }
    console.log(`Seeded ${createdUsers.length} users with hashed passwords.`);

    // Seed Events
    const createdEvents = await Event.insertMany(eventsSeed);
    console.log(`Seeded ${createdEvents.length} events with varying description lengths.`);

    // Generate seats and pre-book/pre-reserve some
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatsToInsert = [];
    const bookingsToCreate = [];
    const reservationsToCreate = [];

    // Helper to pick random element
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    for (let eIndex = 0; eIndex < createdEvents.length; eIndex++) {
      const event = createdEvents[eIndex];
      
      // We will book seats A3, A4, B1 on each event
      // We will reserve seats C5, D6 on each event
      const bookedList = ['A3', 'A4', 'B1'];
      const reservedList = ['C5', 'D6'];

      for (const row of rows) {
        for (let num = 1; num <= 10; num++) {
          const seatNum = `${row}${num}`;
          let status = 'available';
          
          if (bookedList.includes(seatNum)) {
            status = 'booked';
          } else if (reservedList.includes(seatNum)) {
            status = 'reserved';
          }

          seatsToInsert.push({
            eventId: event._id,
            seatNumber: seatNum,
            status: status
          });
        }
      }

      // Create Booking documents
      bookedList.forEach((seatNum, idx) => {
        const user = createdUsers[idx % createdUsers.length];
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        bookingsToCreate.push({
          bookingId: `BK-${randomHex}`,
          userId: user._id,
          eventId: event._id,
          seatNumbers: [seatNum],
          bookedAt: new Date(Date.now() - (idx + 1) * 3600 * 1000) // booked a few hours ago
        });
      });

      // Create Reservation documents (active for 30 minutes from now so they don't expire immediately)
      reservedList.forEach((seatNum, idx) => {
        const user = createdUsers[(idx + 4) % createdUsers.length];
        reservationsToCreate.push({
          userId: user._id,
          eventId: event._id,
          seatNumbers: [seatNum],
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // active for 30 mins
        });
      });
    }

    // Insert all Seats, Bookings, and Reservations
    const createdSeats = await Seat.insertMany(seatsToInsert);
    console.log(`Seeded ${createdSeats.length} seats total (60 per event).`);

    const createdBookings = await Booking.insertMany(bookingsToCreate);
    console.log(`Seeded ${createdBookings.length} booking transactions.`);

    const createdReservations = await Reservation.insertMany(reservationsToCreate);
    console.log(`Seeded ${createdReservations.length} live active seat holds.`);

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
