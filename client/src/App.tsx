import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Login/Login';
import { useLoginStore } from './components/Login/Script';
import Home from './pages/Home/Home';
import About from './pages/About/About';

function App() {
  const isLoggedIn = useLoginStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App
