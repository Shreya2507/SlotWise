export function parseISTDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
}

// export function isBeforeIST(comparisonTime, hoursBefore = 0) {
//   const now = new Date();
//   const istTime = new Date(now.toLocaleString('en-IN', {
//     timeZone: 'Asia/Kolkata'
//   }));
//   const cutoffTime = new Date(comparisonTime);
//   cutoffTime.setHours(cutoffTime.getHours() - hoursBefore);
//   return istTime <= cutoffTime;
// }

export function isBeforeIST(comparisonTime, hoursBefore = 0) {
  const now = new Date();
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const cutoffTime = new Date(comparisonTime);
  cutoffTime.setHours(cutoffTime.getHours() - hoursBefore);
  return istNow <= cutoffTime;
}

export function formatIST(time) {
  return new Date(time).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// utils/time.js
// export function canCancelBooking(slotDate, slotTime) {
//   // Parse the slot date and time in IST
//   const [startTime] = slotTime.split(' - ');
//   const slotDateTime = new Date(`${slotDate}T${startTime}:00+05:30`);

//   // Get current time in IST
//   const nowIST = new Date().toLocaleString('en-US', { 
//     timeZone: 'Asia/Kolkata' 
//   });
//   const currentIST = new Date(nowIST);

//   // Calculate 2 hours before slot in IST
//   const cancellationDeadline = new Date(slotDateTime);
//   cancellationDeadline.setHours(cancellationDeadline.getHours() - 2);

//   return currentIST <= cancellationDeadline;
// }

// Add this new function to time.js
export function getTimeRemaining(targetTime) {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const diffMs = targetTime - nowIST;

  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
export function getTimeRemainingString(targetTime) {
  const remaining = getTimeRemaining(targetTime);

  if (!remaining) return "Deadline passed";

  if (remaining.hours > 24) {
    const days = Math.floor(remaining.hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  }

  if (remaining.hours > 0) {
    return `${remaining.hours} hour${remaining.hours !== 1 ? 's' : ''} ${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''} remaining`;
  }

  return `${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''} remaining`;
}



//
// Add this helper function to get current IST time
export function getCurrentIST() {
  const now = new Date();
  // IST is UTC+5:30 (5.5 hours)
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

// Add this function to format dates consistently in YYYY-MM-DD format
export function formatDateForFirebase(date) {
  const d = new Date(date);
  // Use UTC methods to avoid timezone issues
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isPastDate(dateString) {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const input = new Date(dateString);
  const inputIST = new Date(input.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  istNow.setHours(0, 0, 0, 0);
  inputIST.setHours(0, 0, 0, 0);

  return inputIST < istNow;
}




// Update canCancelBooking to use consistent time comparisons
export function canCancelBooking(slotDate, slotTime) {
  const [startTime] = slotTime.split(' - ');
  const [hours, minutes] = startTime.split(':').map(Number);

  // Create slot date in local time
  const slotDateTime = new Date(slotDate);
  slotDateTime.setHours(hours, minutes, 0, 0);

  // Calculate 2 hours before slot
  const cancellationDeadline = new Date(slotDateTime.getTime() - (15 * 60 * 1000));

  // Compare with current time
  const now = new Date();
  return now <= cancellationDeadline;
}

// Simplify isCurrentDate
export function isCurrentDate(dateString) {
  const today = new Date();
  const inputDate = new Date(dateString);

  return (
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate()
  );
}

export function isPastTimeSlot(dateString, timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create slot datetime in IST
  const istSlot = new Date(new Date(dateString).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  istSlot.setHours(hours, minutes, 0, 0);

  // Current time in IST
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  console.log("Slot IST:", istSlot.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
  console.log("Now IST :", nowIST.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

  return istSlot < nowIST;
}

// utils/time.js
export function isNextWeek(date) {
  const today = new Date();
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + 7);
  nextWeekStart.setHours(0, 0, 0, 0);
  
  return new Date(date) >= nextWeekStart;
}

