const TimeSlotReservation = require('../models/TimeSlotReservation');
const { STATUS } = require('../constants/status');

class AtomicReservationService {
  
  // Atomically reserve a time slot
  static async reserveTimeSlot(barberId, date, startTime, endTime, reservationType, reservedBy) {
    try {
      const reservation = await TimeSlotReservation.findOneAndUpdate(
        {
          barberId,
          date: new Date(date),
          startTime
        },
        {
          barberId,
          date: new Date(date),
          startTime,
          endTime,
          reservationType,
          reservedBy,
          reservedAt: new Date()
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      return { success: true, reservation };
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - slot already reserved
        return { success: false, message: 'Time slot already reserved' };
      }
      throw error;
    }
  }

  // Check if reservation is valid and belongs to user
  static async validateReservation(barberId, date, startTime, reservedBy) {
    const reservation = await TimeSlotReservation.findOne({
      barberId,
      date: new Date(date),
      startTime,
      reservedBy
    });
    
    return reservation !== null;
  }

  // Remove reservation (when appointment is created or cancelled)
  static async removeReservation(barberId, date, startTime, reservedBy) {
    await TimeSlotReservation.findOneAndDelete({
      barberId,
      date: new Date(date),
      startTime,
      reservedBy
    });
  }

  // Check if slot is reserved by anyone
  static async isSlotReserved(barberId, date, startTime) {
    const reservation = await TimeSlotReservation.findOne({
      barberId,
      date: new Date(date),
      startTime
    });
    
    return reservation !== null;
  }
}

module.exports = AtomicReservationService;