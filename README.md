# SlotWise - Training Slot Booking Application

**SlotWise** is a web application designed to simplify the process of booking training slots for trainers and trainees. It helps manage training schedules, attendance, and provides an efficient way for admins to oversee bookings and daily reports.

## Demo
https://github.com/user-attachments/assets/0e1ad132-352f-4c88-a3b6-eb14d10768de

<br>

## ⚡ Tech Stack
- **Frontend**: React, Tailwind CSS  
- **Backend / Database**: Firebase Realtime Database  
- **Authentication**: Firebase Authentication

## 🚀 Features

### ✅ User Features
- **Authentication System**
  - User login and registration.
  - Forgot password functionality with email link to reset the password.
    
- **Slot Booking & Cancellation**  
  Users can book available training slots or cancel their existing bookings with ease.

- **Attendance Marking**  
  After the scheduled slot time passes, users can mark their attendance.

- **Attendance Visibility**  
  Users can view their own number of missed slots.

- **Booking Restrictions**
  - Cannot book more than **3 slots per day**.
  - Can only book maximum **2 consecutive slots**.
  - Slots can be booked up to **1 week in advance**.
  - New week's slots open every **Saturday**.

### ✅ Admin Features
- Receive a **daily report** email showing:
  - Which slots are booked.
  - Who booked or cancelled them.
  - Attendance of each user.

- **Trainer Management**  
  Admin can edit trainer names.
