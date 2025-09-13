const admin = require('firebase-admin');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL || 'https://slotbooking-51b99-default-rtdb.firebaseio.com'
});
const db = admin.database();

// Email Config
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function generateReport() {
  try {
    // Get today's date in YYYY-MM-DD format (same format as your Firebase dates)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Fetch data from Firebase
    const snapshot = await db.ref('rooms').once('value');
    const rooms = snapshot.val();

    // Prepare data for Excel
    const reportData = [];

    // Process each room
    for (const [roomId, roomData] of Object.entries(rooms)) {
      // Add basic room info
      const roomEntry = {
        'Room ID': roomId,
        'Room Name': roomData.name || 'Unnamed Room'
      };

      // Process slots if they exist
      if (roomData.slots) {
        // Check if today's date exists in slots
        if (roomData.slots[todayString]) {
          for (const [timeSlot, booking] of Object.entries(roomData.slots[todayString])) {
            reportData.push({
              ...roomEntry,
              'Date': todayString,
              'Time Slot': timeSlot,
              'Booked By': booking.bookedBy || 'Available',
              'Booked At': booking.bookedAt || 'Not booked'
            });
          }
        } else {
          // Add entry for rooms with no slots today
          reportData.push({
            ...roomEntry,
            'Date': todayString,
            'Time Slot': 'No bookings today',
            'Booked By': '',
            'Booked At': ''
          });
        }
      } else {
        // Add entry for rooms with no slots at all
        reportData.push({
          ...roomEntry,
          'Date': todayString,
          'Time Slot': 'No bookings configured',
          'Booked By': '',
          'Booked At': ''
        });
      }
    }

    // Convert to Excel
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Rooms Report');
    const excelBuffer = XLSX.write(wb, { type: 'buffer' });

    // Send Email
    await transporter.sendMail({
      from: `"Report Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_USER,
      subject: `Daily Room Slot Booking Report - ${todayString}`,
      text: `Attached is the daily report for ${todayString}.`,
      attachments: [{
        filename: `daily_rooms_report_${todayString}.xlsx`,
        content: excelBuffer,
      }],
    });

    console.log('Daily report sent successfully!');

  } catch (error) {
    console.error('Error:', error); 
    process.exit(1); // Exit with error code
  } finally {
    process.exit(0); // Ensure clean exit
  }
}

generateReport();

// const admin = require('firebase-admin');
// const XLSX = require('xlsx');
// const nodemailer = require('nodemailer');
// const fs = require('fs');

// // Initialize Firebase
// const serviceAccount = require('./serviceAccountKey.json'); // Changed from readFileSync
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: process.env.FIREBASE_DB_URL || 'https://slotbooking-51b99-default-rtdb.firebaseio.com'
// });
// const db = admin.database();

// // Email Config
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// async function generateReport() {
//   try {
//     // Fetch data from Firebase
//     const snapshot = await db.ref('rooms').once('value');
//     const rooms = snapshot.val();

//     // Prepare data for Excel
//     const reportData = [];

//     // Process each room
//     for (const [roomId, roomData] of Object.entries(rooms)) {
//       // Add basic room info
//       const roomEntry = {
//         'Room ID': roomId,
//         'Room Name': roomData.name || 'Unnamed Room'
//       };

//       // Process slots if they exist
//       if (roomData.slots) {
//         for (const [date, timeSlots] of Object.entries(roomData.slots)) {
//           for (const [timeSlot, booking] of Object.entries(timeSlots)) {
//             reportData.push({
//               ...roomEntry,
//               'Date': date,
//               'Time Slot': timeSlot,
//               'Booked By': booking.bookedBy || 'Available',
//               'Booked At': booking.bookedAt || 'Not booked'
//             });
//           }
//         }
//       } else {
//         // Add entry for rooms with no slots
//         reportData.push({
//           ...roomEntry,
//           'Date': 'No booking',
//           'Time Slot': '',
//           'Booked By': '',
//           'Booked At': ''
//         });
//       }
//     }

//     // Convert to Excel
//     const ws = XLSX.utils.json_to_sheet(reportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Rooms Report');
//     const excelBuffer = XLSX.write(wb, { type: 'buffer' });

//     // Send Email
//     await transporter.sendMail({
//       from: `"Report Bot" <${process.env.EMAIL_USER}>`,
//       to: process.env.RECIPIENT_USER, // Change to recipient email
//       subject: 'Weekly Room Slot Booking Report',
//       text: 'Attached is the latest report.',
//       attachments: [{
//         filename: 'rooms_report.xlsx',
//         content: excelBuffer,
//       }],
//     });

//     console.log('Report sent successfully!');

//   } catch (error) {
//     console.error('Error:', error); 
//     process.exit(1); // Exit with error code

//   } finally {
//     process.exit(0); // Ensure clean exit
//   }
// }


// generateReport();