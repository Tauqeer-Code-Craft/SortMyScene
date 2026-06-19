const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an event name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add an event description'],
    },
    dateTime: {
      type: Date,
      required: [true, 'Please add event date and time'],
    },
    venue: {
      type: String,
      required: [true, 'Please add event venue'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
      default: 60,
    },
    posterUrl: {
      type: String,
      required: [true, 'Please add event poster URL'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
