import { useEffect, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

export default function DatePicker({ selectedDate, setSelectedDate }) {
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isTodayOrBefore = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate <= today;
  };

  // Check if date is more than 7 days in future
  const isMoreThan7Days = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    return date > maxDate;
  };

  const getNextValidDate = useCallback((date, daysToAdd) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + daysToAdd);
    while (isWeekend(newDate)) {
      newDate.setDate(newDate.getDate() + (daysToAdd > 0 ? 1 : -1));
    }
    return newDate;
  }, []);

  const handleDateChange = useCallback((days) => {
    const newDate = getNextValidDate(selectedDate, days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(newDate);
    compareDate.setHours(0, 0, 0, 0);

    // Prevent going before today or more than 7 days in future
    if (compareDate < today || isMoreThan7Days(compareDate)) return;

    setSelectedDate(newDate);
  }, [selectedDate, getNextValidDate, setSelectedDate]);

  // Add this effect to ensure initial date is within range
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);

    if (selectedDate < today || selectedDate > maxDate) {
      setSelectedDate(today);
    }
  }, [selectedDate, setSelectedDate]);

  // Keep the existing weekend check
  useEffect(() => {
    if (isWeekend(selectedDate)) {
      const nextValidDate = getNextValidDate(selectedDate, 1);
      setSelectedDate(nextValidDate);
    }
  }, [selectedDate, getNextValidDate, setSelectedDate]);

  //   const isMoreThanCurrentWeek = (date) => {
  //   const today = new Date();
  //   const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  //   const currentFriday = new Date(today);
  //   currentFriday.setDate(today.getDate() + (5 - currentDay)); // Friday of current week
  //   currentFriday.setHours(23, 59, 59, 999);

  //   return date > currentFriday;
  // };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
      <button
        onClick={() => handleDateChange(-1)}
        disabled={isTodayOrBefore(selectedDate)}
        className={`px-2 py-2 md:px-4 md:py-2 border-2 rounded transition-all ease-in-out ${isTodayOrBefore(selectedDate)
          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
          : 'border-blue-300 hover:bg-blue-300'
          }`}
      >
        <ChevronLeftIcon className={`h-5 w-5 md:hidden ${isTodayOrBefore(selectedDate) ? 'text-gray-400' : 'text-blue-600'}`} />
        <span className="hidden md:inline">Previous</span>
      </button>

      <div className="text-lg font-medium text-center">
        {selectedDate.toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      <button
        onClick={() => handleDateChange(1)}
        disabled={isMoreThan7Days(selectedDate)}
        className={`px-4 py-2 border-2 rounded transition-all ease-in-out flex items-center justify-center ${isMoreThan7Days(selectedDate)
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-blue-300 hover:bg-blue-300'
          }`}
      >
        <ChevronRightIcon className={`h-5 w-5 md:hidden ${isMoreThan7Days(selectedDate) ? 'text-gray-400' : 'text-blue-600'}`} />
        <span className="hidden md:inline">Next</span>
      </button>
    </div>
  );
}

