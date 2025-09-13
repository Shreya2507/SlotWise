import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import ExportBookingsButton from './ExportBookingsButton';

function BookingsContainer() {
  const [data, setData] = useState({});

  useEffect(() => {
    const db = getDatabase();
    const rootRef = ref(db);

    const unsubscribe = onValue(rootRef, (snapshot) => {
      const firebaseData = snapshot.val();
      console.log("Fetched Firebase data:", firebaseData);
      setData(firebaseData || {});
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {data.rooms && data.users && (
        <ExportBookingsButton data={data.rooms} users={data.users} />
      )}
    </div>
  );
}

export default BookingsContainer;