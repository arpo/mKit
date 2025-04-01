import React from 'react';
// import { useHomeStore } from './Store'; // Uncomment when store is used
import Counter from '../../components/Counter/Counter'; // Import the counter component

function Home() {
  // const { someState, someAction } = useHomeStore.getState(); // Example access

  // Initialize logic if needed (following the no-useEffect pattern)
  // if (!initialDataLoaded) {
  //   loadDataAction();
  // }

  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <Counter /> {/* Include the Counter component here */}
    </div>
  );
}

export default Home;
