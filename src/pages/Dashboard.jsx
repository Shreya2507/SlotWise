// Dashboard.jsx
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getRooms, bookSlot, cancelBooking, getUserBookingsForAttendance } from '../services/BookingService';
import RoomGrid from '../components/booking/RoomGrid';
import DatePicker from '../components/booking/DatePicker';
import { getUserName } from '../services/userService';
import AttendanceModal from '../components/AttendanceModal';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import {
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceBookings, setAttendanceBookings] = useState([]); // Add this state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false); // Add this state
  const [userData, setUserData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const { logout } = useContext(AuthContext);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user?.uid) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        setUserData(snapshot.val());
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.uid) {
        const name = await getUserName(user.uid);
        setUserName(name);
      }
    };

    fetchUserName();
  }, [user]);

  // Fetch rooms data with realtime updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = getRooms((roomsData) => {
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check for attendance when user logs in
  useEffect(() => {
    if (!user?.uid) return;

    const checkAttendance = async () => {
      try {
        const bookings = await getUserBookingsForAttendance(user.uid);
        if (bookings.length > 0) {
          setAttendanceBookings(bookings);
          setShowAttendanceModal(true);
        }
      } catch (error) {
        console.error("Error checking attendance:", error);
      }
    };

    checkAttendance();
  }, [user]);

  const handleBookSlot = async (roomId, date, slotTime, userId) => {
    try {
      await bookSlot(roomId, date, slotTime, userId, userName);
    } catch (error) {
      console.error("Booking failed:", error);
      throw error;
    }
  };

  const handleCancelBooking = async (roomId, date, slotTime) => {
    try {
      await cancelBooking(roomId, date, slotTime, user.uid);
    } catch (error) {
      console.error("Cancellation failed:", error);
      throw error;
    }
  };

  const handleAttendanceComplete = () => {
    setShowAttendanceModal(false);
    setAttendanceBookings([]);
  };

  return (
    <div className="container px-5 sm:mx-auto py-4 font-Roboto relative">
      <div className='mt-2 sm:mt-4 flex items-start w-full justify-between'>
        <div>
          <h1 className="text-3xl w-full font-bold mb-1">Slot Booking Dashboard</h1>
          <p className="text-gray-600 text-xl">Welcome, {userName}</p>
          <p className="text-gray-600 mb-10 text-lg">{user?.email}</p>
        </div>
        {/* User Profile Area with Notification Dot */}
        <div className="flex items-center gap-4">
          {/* Single Icon with Conditional Badge */}
          <div className="relative flex justify-center items-center group">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="focus:outline-none"
              aria-label={userData?.noShowCount > 0 ? "Missed slots warning" : "'No-show' record"}
            >
              {/* Always show clock icon */}
              <div className='h-9 w-9'>
                <ClockIcon
                  className={`h-full w-full transition-colors ${userData?.noShowCount > 0
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-gray-400 hover:text-blue-500"
                    }`}
                />
              </div>

              {/* Badge only appears when no-shows exist */}
              {userData?.noShowCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {userData.noShowCount}
                </span>
              )}
            </button>

            {/* Tooltip - changes content based on no-show count */}
            {(showTooltip || userData?.noShowCount > 0) && (
              <div className={`
        absolute right-0 top-full mt-2 
        ${showTooltip ? 'block' : 'hidden group-hover:block'} 
        bg-white shadow-lg rounded-lg p-3 text-sm w-64 z-50 
        border border-gray-200
      `}>
                {userData?.noShowCount > 0 ? (
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-600">
                        Missed slots: {userData.noShowCount}
                      </p>
                      <p className="text-gray-600 mt-1 text-xs">
                        {userData.noShowCount > 2
                          ? "Frequent no-shows may limit future bookings"
                          : "Please cancel unwanted bookings in advance"
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">'No-show' Record</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cancel the slots you can't attend to avoid penalties.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors "
          >
            Logout
          </button>
        </div>
      </div>



      {/* <h1 className="text-3xl w-1/2 sm:w-full font-bold mt-2 mb-1">Slot Booking Dashboard</h1>
      <p className="text-gray-600 text-xl">Welcome, {userName}</p>
      <p className="text-gray-600 mb-10 text-lg">{user?.email}</p> */}

      <div className="mb-6">
        <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading rooms...</div>
      ) : (
        <div className="space-y-8">
          {rooms.map(room => (
            <RoomGrid
              key={room.id}
              room={room}
              selectedDate={selectedDate}
              currentUser={user}
              onBookSlot={handleBookSlot}
              onCancelBooking={handleCancelBooking}
              isAdmin={user?.isAdmin}
            />
          ))}
        </div>
      )}


      {showAttendanceModal && (
        <AttendanceModal
          bookings={attendanceBookings}
          onComplete={handleAttendanceComplete}
        />
      )}
    </div>
  );
}