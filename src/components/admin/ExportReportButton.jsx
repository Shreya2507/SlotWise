import * as XLSX from 'xlsx';

export default function ExportReportButton({ rooms, date }) {
  const exportToExcel = () => {
    const dateStr = date.toISOString().split('T')[0];
    const reportData = [];

    // Transform data
    rooms.forEach(room => {
      const slots = room.slots?.[dateStr] || {};
      Object.entries(slots).forEach(([time, booking]) => {
        if (booking) {
          reportData.push({
            'Room': room.name || room.id,
            'Date': dateStr,
            'Time Slot': time,
            'Booked By': booking.bookedBy,
            'User ID': booking.bookedByUid,
            'Booking Time': booking.bookedAt
          });
        }
      });
    });

    // Generate Excel
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `bookings_${dateStr}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      Export to Excel
    </button>
  );
}