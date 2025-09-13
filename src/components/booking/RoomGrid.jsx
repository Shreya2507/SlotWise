import { useEffect, useState, forwardRef } from 'react';
import TimeSlot from './TimeSlot';
import { isPastDate } from '../../utils/time';
import Snackbar from '@mui/material/Snackbar';
import { ref, update, get } from 'firebase/database';
import { db } from '../../firebase';
import MuiAlert from '@mui/material/Alert';
import { getNoShowCount } from '../../services/userService';
import { ALL_TIME_SLOTS } from '../../constants/timeSlots';
import AttendanceModal from '../AttendanceModal';
import { formatDateForFirebase } from '../../utils/time';

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function RoomGrid({
  room,
  selectedDate,
  currentUser,
  onBookSlot,
  onCancelBooking,
  onRecordAttendance,
  isAdmin
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [noShowCount, setNoShowCount] = useState(0);

  // Update the instructor-related state and functions in RoomGrid.jsx
  const [editingInstructor, setEditingInstructor] = useState(false);
  const [newRoomInstructor, setNewRoomInstructor] = useState('');
  const [loadingInstructor, setLoadingInstructor] = useState(false);

  // Add this effect to set the initial instructor value
  useEffect(() => {
    // Get instructor for the selected date or fall back to room's default instructor
    const dateStr = formatFirebaseDate(selectedDate);
    const dateInstructor = room.instructors?.[dateStr] || room.instructor;
    setNewRoomInstructor(dateInstructor);
  }, [selectedDate, room]);

  const handleInstructorUpdate = async () => {
    if (!newRoomInstructor.trim()) return;
    setLoadingInstructor(true);

    try {
      const dateStr = formatFirebaseDate(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

      // If editing a past date, don't allow changes
      if (selectedDateObj < today) {
        setSnackbarMessage("Cannot change instructor for past dates");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      // Update instructor for this date and all future dates unless changed
      const updates = {};
      updates[`rooms/${room.id}/instructors/${dateStr}`] = newRoomInstructor;

      // If this is today, also update the default instructor
      if (selectedDateObj.getTime() === today.getTime()) {
        updates[`rooms/${room.id}/instructor`] = newRoomInstructor;
      }

      await update(ref(db), updates);
      setEditingInstructor(false);
      setSnackbarMessage("Instructor updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating instructor:", error);
      setSnackbarMessage("Failed to update instructor");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingInstructor(false);
    }
  };

  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    const checkPendingAttendance = async () => {
      if (!currentUser?.uid) return;

      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      const roomsData = snapshot.val() || {};

      const now = new Date();
      const today = formatDateForFirebase(now);

      const pending = [];

      for (const roomId in roomsData) {
        const slots = roomsData[roomId].slots?.[today] || {};
        for (const time in slots) {
          const slot = slots[time];
          if (slot.bookedByUid === currentUser.uid && slot.attended === null) {
            const [startTime] = time.split(' - ');
            const [hours, minutes] = startTime.split(':').map(Number);
            const slotEnd = new Date(now);
            slotEnd.setHours(hours, minutes, 0, 0);
            // Add 1 hour to end time (or adjust based on your slot duration)
            slotEnd.setHours(slotEnd.getHours() + 1);

            if (now > slotEnd) {
              pending.push({
                roomId,
                roomName: roomsData[roomId].name,
                time,
                date: today,
                userId: currentUser.uid,
                noShowCount: noShowCount
              });
            }
          }
        }
      }

      if (pending.length > 0) {
        setPendingAttendance(pending);
        setShowAttendanceModal(true);
      }
    };

    checkPendingAttendance();
  }, [currentUser, noShowCount]);

  useEffect(() => {
    const fetchNoShowCount = async () => {
      if (currentUser?.uid) {
        const count = await getNoShowCount(currentUser.uid);
        setNoShowCount(count);
      }
    };
    fetchNoShowCount();
  }, [currentUser]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const formatFirebaseDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = formatFirebaseDate(selectedDate);

  useEffect(() => {
    const bookedSlots = room.slots?.[dateStr] || {};
    const mergedSlots = ALL_TIME_SLOTS.map(({ time, index }) => ({
      time,
      index,
      booking: bookedSlots[time] || null,
      bookedByName: bookedSlots[time]?.bookedBy,
      bookedByUid: bookedSlots[time]?.bookedByUid,
      attended: bookedSlots[time]?.attended
    }));
    setSlots(mergedSlots);
  }, [room, selectedDate, dateStr]);


  // Clear error when date changes
  useEffect(() => {
    setError('');
  }, [selectedDate]);

  const handleSlotClick = async (time) => {
    const slot = slots.find(s => s.time === time);

    try {
      setLoading(true); // Set loading true at the start of the click handler
      setError('');

      if (slot?.booking && slot.booking.bookedByUid === currentUser.uid) {
        // If it's the current user's booking, show the modal
        setSlotToCancel(slot);
        setShowCancelModal(true);
        setLoading(false); // Set loading to false as we are showing a modal, not performing an async operation immediately
      } else if (!slot?.booking) {
        // If it's an unbooked slot, proceed with booking
        await onBookSlot(room.id, dateStr, time, currentUser.uid);
        // alert(`Slot Booked for ${time} on ${dateStr}`);
        // Success feedback
        setSnackbarMessage(`Booked slot for ${time} on ${dateStr}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setLoading(false); // Set loading to false after booking
      } else {
        // If it's booked by someone else, simply set loading to false.
        // No action needed for clicking other people's bookings, just reset loading.
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false); // Always reset loading on error
    }
  };

  const confirmCancel = async () => {
    console.log("Clicked confirm");
    if (!slotToCancel) return;

    try {
      setLoading(true); // Set loading true for the cancellation action
      setError('');
      await onCancelBooking(room.id, dateStr, slotToCancel.time, currentUser.uid);
      // alert(`Cancelled slot for ${slotToCancel.time} on ${dateStr}`);
      // Error feedback
      setSnackbarMessage(`Slot booking cancelled for ${slotToCancel.time} on ${dateStr}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Always reset loading after cancellation attempt
      setShowCancelModal(false);
      setSlotToCancel(null);
    }
  };

  const cancelCancellation = () => {
    console.log("Clicked cancel");
    setShowCancelModal(false);
    setSlotToCancel(null);
    setLoading(false); // Ensure loading is false when modal is dismissed
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow relative">
      <h2 className="text-xl font-bold">{room.name}</h2>
      <div className="flex items-center gap-2 mb-2">
        {editingInstructor ? (
          <>
            <input
              type="text"
              value={newRoomInstructor}
              onChange={(e) => setNewRoomInstructor(e.target.value)}
              className="border p-1 flex-1"
              autoFocus
            />
            <button
              onClick={handleInstructorUpdate}
              disabled={loadingInstructor}
              className="p-1 bg-green-500 text-white rounded"
            >
              {loadingInstructor ? 'Saving...' : '✓'}
            </button>
            <button
              onClick={() => {
                setEditingInstructor(false);
                const dateStr = formatFirebaseDate(selectedDate);
                setNewRoomInstructor(room.instructors?.[dateStr] || room.instructor);
              }}
              className="p-1 bg-gray-300 rounded"
            >
              ✗
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">
              Instructor - {newRoomInstructor}
              {isAdmin && (
                <button
                  onClick={() => setEditingInstructor(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 ml-2"
                  title="Edit room Instructor"
                >
                  ✏️
                </button>
              )}
            </h2>
          </>
        )}
      </div>
      {/* <div className="flex items-center gap-2 mb-2">
        {editingInstructor ? (
          <>
            <input
              type="text"
              value={newRoomInstructor}
              onChange={(e) => setNewRoomInstructor(e.target.value)}
              className="border p-1 flex-1"
              autoFocus
            />
            <button
              onClick={handleInstructorUpdate}
              disabled={loadingInstructor}
              className="p-1 bg-green-500 text-white rounded"
            >
              {loadingInstructor ? 'Saving...' : '✓'}
            </button>
            <button
              onClick={() => {
                setEditingInstructor(false);
                setNewRoomInstructor(room.instructor);
              }}
              className="p-1 bg-gray-300 rounded"
            >
              ✗
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Instructor - {room.instructor}</h2>
            {isAdmin && (
              <button
                onClick={() => setEditingInstructor(true)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Edit room Instructor"
              >
                ✏️
              </button>
            )}
          </>
        )}
      </div> */}
      {/* 
      <p className="text-gray-600 mb-4">{room.description}</p> */}

      {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map(({ time, booking, attended }) => (
          <TimeSlot
            key={time}
            time={time}
            isBooked={!!booking}
            bookedBy={booking?.bookedBy}
            isUserBooking={booking?.bookedByUid === currentUser?.uid}
            onClick={() => handleSlotClick(time)}
            onRecordAttendance={onRecordAttendance}
            disabled={loading || isPastDate(dateStr)}
            slotDate={dateStr}
            attended={attended}
            noShowCount={noShowCount}
           
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      {showCancelModal && (
        // Add a higher z-index to the overlay and modal content for good measure
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50"
          // Add onClick to the overlay to close the modal when clicking outside of it
          onClick={cancelCancellation}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto relative z-50"
          // REMOVE this onClick handler: onClick={(e) => e.stopPropagation()}
          // It was preventing button clicks from registering
          >
            <h3 className="text-lg font-bold mb-4">Confirm Cancellation</h3>
            <p className="mb-4">Are you sure you want to cancel the booking for {slotToCancel?.time} on {dateStr} ?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 cursor-pointer"
                onClick={cancelCancellation}
                disabled={loading}
              >
                No, Keep It
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
                onClick={confirmCancel}
                disabled={loading}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* The Material-UI Snackbar component */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000} // Disappears after 2 seconds
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position at the bottom center
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {showAttendanceModal && (
      <AttendanceModal
        bookings={pendingAttendance}
        onComplete={() => setShowAttendanceModal(false)}
      />
      
    )}
    </div>

  );
}

// import { useEffect, useState, forwardRef } from 'react';
// import TimeSlot from './TimeSlot';
// import { isPastDate } from '../../utils/time';
// import Snackbar from '@mui/material/Snackbar';
// import MuiAlert from '@mui/material/Alert';

// // Define your constant time slots
// const ALL_TIME_SLOTS = [
//   '10:00 - 11:00',
//   '11:00 - 12:00',
//   '12:30 - 13:30',
//   '14:00 - 15:00',
//   '15:00 - 16:00',
//   '16:30 - 17:30',
//   '22:15 - 23:00' //extra
// ];

// const Alert = forwardRef(function Alert(props, ref) {
//   return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
// });

// export default function RoomGrid({
//   room,
//   selectedDate,
//   currentUser,
//   onBookSlot,
//   onCancelBooking
// }) {
//   const [slots, setSlots] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showCancelModal, setShowCancelModal] = useState(false); // New state for modal visibility
//   const [slotToCancel, setSlotToCancel] = useState(null); // New state to store the slot to be canceled

//   // New state variables for the Snackbar
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarSeverity, setSnackbarSeverity] = useState('success');

//   const handleCloseSnackbar = (event, reason) => {
//     if (reason === 'clickaway') { // Prevents closing when clicking outside the snackbar
//       return;
//     }
//     setSnackbarOpen(false);
//   };

//   const formatFirebaseDate = (date) => {
//     const d = new Date(date);
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const dateStr = formatFirebaseDate(selectedDate);

//   useEffect(() => {
//     const bookedSlots = room.slots?.[dateStr] || {};

//     const mergedSlots = ALL_TIME_SLOTS.map(time => ({
//       time,
//       booking: bookedSlots[time] || null,
//       bookedByName: bookedSlots[time]?.bookedBy,
//       bookedByUid: bookedSlots[time]?.bookedByUid
//     }));

//     setSlots(mergedSlots);
//   }, [room, selectedDate, dateStr]);

//   // Clear error when date changes
//   useEffect(() => {
//     setError('');
//   }, [selectedDate]);

//   const handleSlotClick = async (time) => {
//     const slot = slots.find(s => s.time === time);

//     try {
//       setLoading(true); // Set loading true at the start of the click handler
//       setError('');

//       if (slot?.booking && slot.booking.bookedByUid === currentUser.uid) {
//         // If it's the current user's booking, show the modal
//         setSlotToCancel(slot);
//         setShowCancelModal(true);
//         setLoading(false); // Set loading to false as we are showing a modal, not performing an async operation immediately
//       } else if (!slot?.booking) {
//         // If it's an unbooked slot, proceed with booking
//         await onBookSlot(room.id, dateStr, time, currentUser.uid);
//         // alert(`Slot Booked for ${time} on ${dateStr}`);
//         // Success feedback
//         setSnackbarMessage(`Booked slot for ${time} on ${dateStr}`);
//         setSnackbarSeverity('success');
//         setSnackbarOpen(true);
//         setLoading(false); // Set loading to false after booking
//       } else {
//         // If it's booked by someone else, simply set loading to false.
//         // No action needed for clicking other people's bookings, just reset loading.
//         setLoading(false);
//       }
//     } catch (err) {
//       setError(err.message);
//       setLoading(false); // Always reset loading on error
//     }
//   };

//   const confirmCancel = async () => {
//     console.log("Clicked confirm");
//     if (!slotToCancel) return;

//     try {
//       setLoading(true); // Set loading true for the cancellation action
//       setError('');
//       await onCancelBooking(room.id, dateStr, slotToCancel.time, currentUser.uid);
//       // alert(`Cancelled slot for ${slotToCancel.time} on ${dateStr}`);
//       // Error feedback
//       setSnackbarMessage(`Slot booking cancelled for ${slotToCancel.time} on ${dateStr}`);
//       setSnackbarSeverity('error');
//       setSnackbarOpen(true);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false); // Always reset loading after cancellation attempt
//       setShowCancelModal(false);
//       setSlotToCancel(null);
//     }
//   };

//   const cancelCancellation = () => {
//     console.log("Clicked cancel");
//     setShowCancelModal(false);
//     setSlotToCancel(null);
//     setLoading(false); // Ensure loading is false when modal is dismissed
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow">
//       <h2 className="text-xl font-bold mb-2">{room.name}</h2>
//       <p className="text-gray-600 mb-4">{room.description}</p>

//       {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//         {slots.map(({ time, booking }) => (
//           <TimeSlot
//             key={time}
//             time={time}
//             isBooked={!!booking}
//             bookedBy={booking?.bookedBy}
//             isUserBooking={booking?.bookedByUid === currentUser?.uid}
//             onClick={() => handleSlotClick(time)}
//             disabled={loading || isPastDate(dateStr)} // Disable time slots if main loading is true
//             slotDate={dateStr}
//           />
//         ))}
//       </div>

//       {/* Confirmation Modal */}
//       {showCancelModal && (
//         // Add a higher z-index to the overlay and modal content for good measure
//         <div
//           className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50"
//           // Add onClick to the overlay to close the modal when clicking outside of it
//           onClick={cancelCancellation}
//         >
//           <div
//             className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto relative z-50"
//           // REMOVE this onClick handler: onClick={(e) => e.stopPropagation()}
//           // It was preventing button clicks from registering
//           >
//             <h3 className="text-lg font-bold mb-4">Confirm Cancellation</h3>
//             <p className="mb-4">Are you sure you want to cancel the booking for {slotToCancel?.time} on {dateStr} ?</p>
//             <div className="flex justify-end gap-3">
//               <button
//                 className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 cursor-pointer"
//                 onClick={cancelCancellation}
//                 disabled={loading}
//               >
//                 No, Keep It
//               </button>
//               <button
//                 className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
//                 onClick={confirmCancel}
//                 disabled={loading}
//               >
//                 Yes, Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* The Material-UI Snackbar component */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={2000} // Disappears after 2 seconds
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position at the bottom center
//       >
//         <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// }
