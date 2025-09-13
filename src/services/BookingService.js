import { db } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { formatDateForFirebase } from '../utils/time';
import { ALL_TIME_SLOTS } from '../constants/timeSlots';
// Fetch all rooms data with realtime updates
export const getRooms = (callback) => {
  const roomsRef = ref(db, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    const roomsData = snapshot.val();
    console.log("Fetched rooms data:", roomsData); // Add this line
    const roomsArray = Object.entries(roomsData || {}).map(([id, room]) => ({
      id,
      ...room
    }));
    callback(roomsArray);
  });
};

export const validateConsecutiveSlots = async (roomId, date, slotTime, userId) => {
  const slotsRef = ref(db, `rooms/${roomId}/slots/${date}`);
  const snapshot = await get(slotsRef);
  if (!snapshot.exists()) return true; // No bookings yet

  const bookedSlots = snapshot.val();
  const allSlots = ALL_TIME_SLOTS.map(s => s.time);
  const currentIndex = ALL_TIME_SLOTS.findIndex(s => s.time === slotTime);

  // Check previous 2 and next 2 slots
  const adjacentSlots = [
    currentIndex - 2,
    currentIndex - 1,
    currentIndex + 1,
    currentIndex + 2
  ].filter(i => i >= 0 && i < allSlots.length);

  let consecutiveCount = 0;
  for (const index of adjacentSlots) {
    const slot = allSlots[index];
    if (bookedSlots[slot]?.bookedByUid === userId) {
      consecutiveCount++;
      if (consecutiveCount >= 2) {
        return false;
      }
    } else {
      consecutiveCount = 0;
    }
  }

  return true;
};




// export const bookSlot = async (roomId, date, slotTime, userId, userName) => {
//   const [startTime] = slotTime.split(' - ');
//   const [hours, minutes] = startTime.split(':').map(Number);

//   // Parse slot datetime in IST
//   const slotDateTimeIST = new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   slotDateTimeIST.setHours(hours, minutes, 0, 0);

//   // Get current IST time
//   const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

//   console.log("Booking Attempt: Slot IST =", slotDateTimeIST.toString(), "Now IST =", nowIST.toString());

//   if (slotDateTimeIST < nowIST) {
//     throw new Error('Cannot book slots that have already passed');
//   }

//   // Format date for Firebase
//   const firebaseDate = formatDateForFirebase(date);
//   const slotPath = `rooms/${roomId}/slots/${firebaseDate}/${slotTime}`;
//   const slotRef = ref(db, slotPath);

//   const snapshot = await get(slotRef);
//   if (snapshot.exists()) {
//     throw new Error('This slot is already booked');
//   }

//   const bookingData = {
//     bookedBy: userName,
//     bookedByUid: userId,
//     bookedAt: new Date().toISOString()
//   };

//   return update(ref(db, slotPath), bookingData);
// };
export const bookSlot = async (roomId, date, slotTime, userId, userName) => {
  const dailyBookings = await getUserDailyBookingCount(userId, date);
  if (dailyBookings >= 3) {
    throw new Error('You can only book up to 3 slots per day');
  }

  const [startTime] = slotTime.split(' - ');
  const [hours, minutes] = startTime.split(':').map(Number);

  // Parse slot datetime in IST
  const slotDateTimeIST = new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  slotDateTimeIST.setHours(hours, minutes, 0, 0);

  // Get current IST time
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  // Calculate current week's Monday (00:00) and Friday (23:59)
  const currentDay = nowIST.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentMonday = new Date(nowIST);
  currentMonday.setDate(nowIST.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Go to Monday
  currentMonday.setHours(0, 0, 0, 0);

  const currentFriday = new Date(currentMonday);
  currentFriday.setDate(currentMonday.getDate() + 4); // Friday of current week
  currentFriday.setHours(23, 59, 59, 999);

  // Calculate next week's Monday (00:00) and Friday (23:59)
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7); // Monday of next week

  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4); // Friday of next week
  nextFriday.setHours(23, 59, 59, 999);

  // Check if slot is in current week or next week
  const isCurrentWeekSlot = slotDateTimeIST >= currentMonday && slotDateTimeIST <= currentFriday;
  const isNextWeekSlot = slotDateTimeIST >= nextMonday && slotDateTimeIST <= nextFriday;

  if (!isCurrentWeekSlot && !isNextWeekSlot) {
    throw new Error('You can only book slots for the current or next week');
  }

  if (isNextWeekSlot) {
    // Check if it's Saturday 7 AM IST or later in the current week
    const currentWeekSaturday = new Date(currentMonday);
    currentWeekSaturday.setDate(currentMonday.getDate() + 5); // Saturday of current week
    currentWeekSaturday.setHours(7, 0, 0, 0); // 7 AM IST

    if (nowIST < currentWeekSaturday) {
      throw new Error('Slots for the next week open every Saturday after 7 AM IST');
    }
  }

  const isValid = await validateConsecutiveSlots(roomId, date, slotTime, userId);
  if (!isValid) {
    throw new Error('You can only book up to 2 consecutive slots');
  }

  // Rest of your existing validation
  // if (slotDateTimeIST < nowIST) {
  //   throw new Error('Cannot book slots that have already passed');
  // }

  const diffInMs = slotDateTimeIST - nowIST;
  const diffInMinutes = diffInMs / (1000 * 60);

  if (diffInMinutes < 15) {
    throw new Error('You can only book a slot at least 15 minutes in advance');
  }


  // Format date for Firebase
  const firebaseDate = formatDateForFirebase(date);
  const slotPath = `rooms/${roomId}/slots/${firebaseDate}/${slotTime}`;
  const slotRef = ref(db, slotPath);

  const snapshot = await get(slotRef);
  if (snapshot.exists()) {
    throw new Error('This slot is already booked');
  }

  const bookingData = {
    bookedBy: userName,
    bookedByUid: userId,
    bookedAt: new Date().toISOString(),
    attended: "pending"

  };

  return update(ref(db, slotPath), bookingData);
};




// export const cancelBooking = (roomId, date, slotTime) => {
//   const updates = {};
//   updates[`rooms/${roomId}/slots/${date}/${slotTime}`] = null;
//   return update(ref(db), updates);
// };
// export const cancelBooking = async (roomId, date, slotTime) => {
//   const updates = {
//     [`rooms/${roomId}/slots/${date}/${slotTime}/bookedBy`]: null,
//     [`rooms/${roomId}/slots/${date}/${slotTime}/bookedByUid`]: null,
//     [`rooms/${roomId}/slots/${date}/${slotTime}/bookedAt`]: null
//   };
//   await update(ref(db), updates);
// };
export const cancelBooking = async (roomId, date, slotTime, userId) => {
  const slotPath = `rooms/${roomId}/slots/${date}/${slotTime}`;
  const slotRef = ref(db, slotPath);

  const snapshot = await get(slotRef);
  if (!snapshot.exists()) throw new Error('Slot not found');

  const booking = snapshot.val();

  // Verify user ownership
  if (booking.bookedByUid !== userId) {
    throw new Error('You can only cancel your own bookings');
  }

  // Parse slot time in IST
  const [startTime] = slotTime.split(' - ');
  const slotDateTime = new Date(`${date}T${startTime}:00+05:30`);

  // Get current IST time
  const nowIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const currentIST = new Date(nowIST);

  // Calculate 2 hours before slot in IST
  const cancellationDeadline = new Date(slotDateTime);
  cancellationDeadline.setMinutes(cancellationDeadline.getMinutes() - 15);

  // Check if current time is before the deadline
  if (currentIST > cancellationDeadline) {
    throw new Error(`Cancellation only allowed until ${cancellationDeadline.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })} IST`);
  }

  // Proceed with cancellation
  const updates = {
    [slotPath]: null  // This will completely remove the timeSlot node
  };
  await update(ref(db), updates);
  // const updates = {
  //   [`${slotPath}/bookedBy`]: null,
  //   [`${slotPath}/bookedByUid`]: null,
  //   [`${slotPath}/bookedAt`]: null
  // };

  // await update(ref(db), updates);
};

export const getUserDailyBookingCount = async (userId, date) => {
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  const rooms = snapshot.val() || {};

  let count = 0;
  const firebaseDate = formatDateForFirebase(date);

  for (const roomId in rooms) {
    const slots = rooms[roomId].slots?.[firebaseDate] || {};
    for (const slotTime in slots) {
      if (slots[slotTime]?.bookedByUid === userId) {
        count++;
      }
    }
  }

  return count;
};

export const getUserBookingsForAttendance = async (userId) => {
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  const rooms = snapshot.val() || {};
  const currentDate = formatDateForFirebase(new Date());
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  let bookings = [];

  for (const roomId in rooms) {
    const room = rooms[roomId];
    const slots = room.slots || {};

    for (const date in slots) {
      if (date > currentDate) continue;

      const timeSlots = slots[date];
      for (const slotTime in timeSlots) {
        const slot = timeSlots[slotTime];

        // Check for "pending" status instead of null
        if (slot.bookedByUid === userId && slot.attended === "pending") {
          const [startTime] = slotTime.split(' - ');
          const [hours, minutes] = startTime.split(':').map(Number);

          // Create slot datetime in IST
          const slotDate = new Date(date);
          const slotDateTimeIST = new Date(slotDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          slotDateTimeIST.setHours(hours, minutes, 0, 0);

          if (slotDateTimeIST < nowIST) {
            bookings.push({
              roomId,
              roomName: room.name,
              date,
              time: slotTime,
              userId,
              noShowCount: 0
            });
          }
        }
      }
    }
  }

  return bookings;
};