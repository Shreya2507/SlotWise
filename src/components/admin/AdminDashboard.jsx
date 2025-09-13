import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getRooms } from '../../services/BookingService';
import ExportReportButton from './ExportReportButton';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = getRooms((roomsData) => {
      setRooms(roomsData);
      // setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!user?.isAdmin) {
    return <div className="p-4 text-red-500">Admin access required</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 float-end"
      >
        Logout
      </button>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* <div className="bg-white p-4 rounded-lg shadow">
          <AdminStats rooms={rooms} />
        </div> */}
        
        <div className="bg-white p-4 rounded-lg shadow col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Daily Bookings</h2>
            <input 
              type="date" 
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border p-2 rounded"
            />
          </div>
          <ExportReportButton 
            rooms={rooms} 
            date={selectedDate} 
          />
        </div>
      </div>
    </div>
  );
}