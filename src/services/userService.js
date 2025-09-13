import { db } from '../firebase';
import { ref, get, update } from 'firebase/database';

export const getUserName = async (userId) => {
  if (!userId) return null;
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val().name : 'Unknown User';
};

export const getUsersMap = async () => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  return snapshot.exists() ? snapshot.val() : {};
};

export const getNoShowCount = async (userId) => {
  const userRef = ref(db, `users/${userId}/noShowCount`);
  const snapshot = await get(userRef);
  return snapshot.val() || 0;
};

export const incrementNoShowCount = async (userId) => {
  const currentCount = await getNoShowCount(userId);
  const updates = {};
  updates[`users/${userId}/noShowCount`] = currentCount + 1;
  await update(ref(db), updates);
  
  // Also record in daily no-show log for reporting
  const today = new Date().toISOString().split('T')[0];
  updates[`noShowLogs/${today}/${userId}`] = currentCount + 1;
  await update(ref(db), updates);
};

export const getDailyNoShowReport = async (date) => {
  const reportRef = ref(db, `noShowLogs/${date}`);
  const snapshot = await get(reportRef);
  return snapshot.val() || {};
};