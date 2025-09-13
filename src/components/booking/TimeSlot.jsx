import { useEffect, useState } from 'react';
import { 
  getTimeRemainingString, 
  canCancelBooking, 
  isCurrentDate
} from '../../utils/time';

export default function TimeSlot({
  time,
  isBooked,
  bookedBy,
  isUserBooking,
  onClick,
  disabled,
  slotDate,
  attended
}) {
  const [deadlineText, setDeadlineText] = useState('');
  const [isActuallyPast, setIsActuallyPast] = useState(false);
  const [isActuallyPastSlot, setIsActuallyPastSlot] = useState(false);

  const getAttendanceStatus = () => {
    if (attended === true) return '✅ Attended';
    if (attended === false) return '❌ No-show';
    return null;
  };

  useEffect(() => {
  // Use consistent timezone handling
  // const now = new Date();
  const slotDateObj = new Date(slotDate);
  
  // Compare dates only for isPast
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  slotDateObj.setHours(0, 0, 0, 0);
  const pastDate = slotDateObj < today;

  // For time slots, compare with current time
  let pastSlot = false;
  if (isCurrentDate(slotDate)) {
    const [startTime] = time.split(' - ');
    const [hours, minutes] = startTime.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    pastSlot = slotDateTime < new Date();
  }

  setIsActuallyPast(pastDate);
  setIsActuallyPastSlot(pastSlot);

    if (!pastSlot && isBooked && isUserBooking) {
      const [startTime] = time.split(' - ');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const slotDateObj = new Date(slotDate);
      slotDateObj.setHours(hours, minutes, 0, 0);
      
      const cancellationDeadline = new Date(slotDateObj.getTime() - (15 * 60 * 1000));
      
      setDeadlineText(getTimeRemainingString(cancellationDeadline));
      
      const interval = setInterval(() => {
        setDeadlineText(getTimeRemainingString(cancellationDeadline));
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [time, slotDate, isBooked, isUserBooking]);

  const canBook = !isBooked && !isActuallyPast && !isActuallyPastSlot && !disabled;
  const canCancel = !isActuallyPastSlot && isBooked && isUserBooking && canCancelBooking(slotDate, time);

  const handleClick = () => {
    if (canBook) {
      onClick();
    } else if (canCancel) {
      onClick();
    }
  };

  return (
    <div 
      className={`p-3 rounded transition-colors text-center flex flex-col justify-center items-center ${
  isActuallyPast || isActuallyPastSlot
    ? isBooked
      ? isUserBooking
        ? 'bg-red-50 ring-2 ring-red-400 border border-red-200 cursor-not-allowed' // User's past booking
        : 'bg-red-100 border border-red-300 cursor-not-allowed' // Others' past bookings
      : 'bg-gray-100 border border-gray-300 cursor-not-allowed' // Available past slots
    : isBooked 
      ? isUserBooking
        ? canCancel
          ? 'bg-amber-100 ring-2 ring-amber-500 shadow-sm hover:ring-amber-600 hover:bg-amber-200 cursor-pointer' // User's cancelable booking
          : 'bg-amber-100 ring-2 ring-amber-500 shadow-sm cursor-default' // User's non-cancelable booking
        : 'bg-red-100 border border-red-300 cursor-default' // Others' bookings
      : 'bg-green-100 border border-green-300 hover:bg-green-200 cursor-pointer' // Available slots
}`}
      onClick={handleClick}
      aria-disabled={!canBook && !canCancel}
    >
      <div className="font-medium">{time}</div>
      {isActuallyPast ? (
        <div className="text-sm mt-1">
          {isBooked ? `Booked by ${bookedBy}` : 'Past date'}
          {attended !== null && (
            <div className="text-xs mt-1">
              {getAttendanceStatus()}
            </div>
          )}
        </div>
      ) : isActuallyPastSlot ? (
        <div className="text-sm mt-1">
          {isBooked ? `Booked by ${bookedBy}` : 'Time passed'}
          {attended !== null && (
            <div className="text-xs mt-1">
              {getAttendanceStatus()}
            </div>
          )}
        </div>
      ) : isBooked ? (
        <div className="text-sm mt-1">
          {isUserBooking ? (
            <>
              <div>Your booking</div>
              {attended !== null && (
                <div className="text-xs mt-1">
                  {getAttendanceStatus()}
                </div>
              )}
              {deadlineText && (
                <div className={`text-sm mt-1 ${
                  deadlineText.includes('passed') ? 'text-black' : 'text-red-600'
                }`}>
                  {deadlineText.includes('passed')
                    ? ''
                    : `Click to cancel`}
                </div>
              )}
            </>
          ) : (
            <>
              <div>Booked by {bookedBy}</div>
              {attended !== null && (
                <div className="text-xs mt-1">
                  {getAttendanceStatus()}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
    // <div 
    //   className={`p-3 rounded border transition-colors text-center flex flex-col justify-center items-center ${
    //     isActuallyPast || isActuallyPastSlot
    //       ? isBooked
    //         ? 'bg-red-100 border-red-300 cursor-not-allowed'
    //         : 'bg-gray-100 border-gray-300 cursor-not-allowed'
    //       : isBooked 
    //         ? isUserBooking
    //           ? canCancel
    //             ? 'bg-amber-100 border-amber-300 hover:bg-amber-200 cursor-pointer'
    //             : 'bg-gray-100 border-gray-300 cursor-default'
    //           : 'bg-red-100 border-red-300 cursor-default'
    //         : 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer'
    //   }`}
    //   onClick={handleClick}
    //   aria-disabled={!canBook && !canCancel}
    // >
    //   <div className="font-medium">{time}</div>
    //   {isActuallyPast ? (
    //     <div className="text-sm mt-1">
    //       {isBooked ? `Booked by ${bookedBy}` : 'Past date'}
    //     </div>
    //   ) : isActuallyPastSlot ? (
    //     <div className="text-sm mt-1">
    //       {isBooked ? `Booked by ${bookedBy}` : 'Time passed'}
    //     </div>
    //   ) : isBooked ? (
    //     <div className="text-sm mt-1">
    //       {isUserBooking ? (
    //         <>
    //           <div>Your booking</div>
    //           {deadlineText && (
    //             <div className={`text-xs mt-1 ${
    //               deadlineText.includes('passed') ? 'text-black' : 'text-red-600'
    //             }`}>
    //               {deadlineText.includes('passed')
    //                 ? deadlineText
    //                 : `Click to cancel`}
    //             </div>
    //           )}
    //         </>
    //       ) : (
    //         <div>Booked by {bookedBy}</div>
    //       )}
    //     </div>
    //   ) : null}
    // </div>
  );
}

// import { useEffect, useState } from 'react';
// import { getTimeRemainingString, canCancelBooking, isPastDate, isPastTimeSlot } from '../../utils/time';

// export default function TimeSlot({
//   time,
//   isBooked,
//   bookedBy,
//   isUserBooking,
//   onClick,
//   disabled,
//   slotDate
// }) {
//   const [deadlineText, setDeadlineText] = useState('');
//   const isPast = isPastDate(slotDate);
//   const isPastSlot = isPastTimeSlot(slotDate, time);
  
//   useEffect(() => {
//     if (!isPastSlot && isBooked && isUserBooking) {
//       const [startTime] = time.split(' - ');
//       const slotDateTime = new Date(`${slotDate}T${startTime}:00+05:30`);
      
//       // Calculate cancellation deadline (2 hours before slot)
//       const cancellationDeadline = new Date(slotDateTime);
//       cancellationDeadline.setHours(cancellationDeadline.getHours() - 2);
      
//       // Update deadline text
//       setDeadlineText(getTimeRemainingString(cancellationDeadline));
      
//       // Update every minute
//       const interval = setInterval(() => {
//         setDeadlineText(getTimeRemainingString(cancellationDeadline));
//       }, 60000);
      
//       return () => clearInterval(interval);
//     }
//   }, [time, slotDate, isBooked, isUserBooking, isPastSlot]);

//   const canCancel = !isPastSlot && isBooked && isUserBooking && canCancelBooking(slotDate, time);
  

//   return (
//     <div 
//       className={`p-3 rounded border transition-colors text-center flex flex-col justify-center items-center ${
//         isPast || isPastSlot
//         ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
//         : isBooked 
//           ? isUserBooking
//             ? canCancel
//               ? 'bg-amber-100 border-amber-300 hover:bg-amber-200 cursor-pointer'
//               : 'bg-gray-100 border-gray-300 cursor-default'
//             : 'bg-red-100 border-red-300 cursor-default'
//           : 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer'
//       }`}
//       onClick={!isPast && (canCancel || !isBooked) ? onClick : undefined}
//       disabled={disabled}
//     >
//       <div className="font-medium">{time}</div>
//       {/* {isPast && (
//       <div className="text-sm mt-1 text-gray-500">Past date</div>
//     )} */}
//       {isBooked && !isPast && !isPastSlot && (
//         <div className="text-sm mt-1">
//           {isUserBooking ? (
//             <>
//               <div>Your booking</div>
//               {deadlineText && (
//                 <div className={`text-xs mt-1 ${
//                   deadlineText.includes('passed') ? 'text-black' : 'text-red-600'
//                 }`}>
//                    {deadlineText.includes('passed')
//               ? deadlineText
//               : `Click to cancel - ${deadlineText}`}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div>Booked by {bookedBy}</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

