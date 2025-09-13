// AttendanceModal.jsx
import { useState } from 'react';
import { ref, update, get } from 'firebase/database';
import { db } from '../firebase';

export default function AttendanceModal({ 
  bookings, 
  onComplete 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const currentBooking = bookings[currentIndex];
  // AttendanceModal.jsx
const handleResponse = async (attended) => {
  setLoading(true);
  try {
    const updates = {};
    const slotPath = `rooms/${currentBooking.roomId}/slots/${currentBooking.date}/${currentBooking.time}`;
    
    // Update attendance status
    updates[`${slotPath}/attended`] = attended;
    
    if (!attended) {
      // Get current no-show count from database
      const userRef = ref(db, `users/${currentBooking.userId}/noShowCount`);
      const snapshot = await get(userRef);
      const currentCount = snapshot.val() || 0;
      
      // Increment no-show count
      updates[`users/${currentBooking.userId}/noShowCount`] = currentCount + 1;
    }
    
    await update(ref(db), updates);
    
    if (currentIndex < bookings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  } catch (error) {
    console.error("Error recording attendance:", error);
  } finally {
    setLoading(false);
  }
};
  
//   const handleResponse = async (attended) => {
//   setLoading(true);
//   try {
//     const updates = {};
//     updates[`rooms/${currentBooking.roomId}/slots/${currentBooking.date}/${currentBooking.time}/attended`] = attended;
    
//     if (!attended) {
//       // Increment no-show count if user didn't attend
//       updates[`users/${currentBooking.userId}/noShowCount`] = currentBooking.noShowCount + 1;
//     }
    
//     await update(ref(db), updates);
//     if (currentIndex < bookings.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     } else {
//       onComplete();
//     }
//   } catch (error) {
//     console.error("Error recording attendance:", error);
//   } finally {
//     setLoading(false);
//   }
// };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-lg font-bold mb-4">Attendance Confirmation</h3>
        <p className="mb-4">
          Did you attend your {currentBooking.time} slot in {currentBooking.roomName} on {currentBooking.date}?
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {currentIndex + 1} of {bookings.length} confirmations
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleResponse(false)}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            No
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

// import { useState } from 'react';
// import { ref, update } from 'firebase/database';
// import { db } from '../firebase';

// export default function AttendanceModal({ 
//   bookings, 
//   onComplete 
// }) {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(false);
  
//   const currentBooking = bookings[currentIndex];
  
//   const handleResponse = async (attended) => {
//     setLoading(true);
//     try {
//       const updates = {};
//       updates[`rooms/${currentBooking.roomId}/slots/${currentBooking.date}/${currentBooking.time}/attended`] = attended;
      
//       if (!attended) {
//         // Increment no-show count if user didn't attend
//         updates[`users/${currentBooking.userId}/noShowCount`] = currentBooking.noShowCount + 1;
//       }
      
//       await update(ref(db), updates);
//       if (currentIndex < bookings.length - 1) {
//         setCurrentIndex(currentIndex + 1);
//       } else {
//         onComplete();
//       }
//     } catch (error) {
//       console.error("Error recording attendance:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-6 rounded-lg max-w-sm w-full">
//         <h3 className="text-lg font-bold mb-4">Attendance Confirmation</h3>
//         <p className="mb-4">
//           Did you attend your {currentBooking.time} slot in {currentBooking.roomName} on {currentBooking.date}?
//         </p>
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={() => handleResponse(false)}
//             disabled={loading}
//             className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//           >
//             No
//           </button>
//           <button
//             onClick={() => handleResponse(true)}
//             disabled={loading}
//             className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//           >
//             Yes
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }