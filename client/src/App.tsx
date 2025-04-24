import { Routes, Route } from 'react-router-dom';
import { Container } from '@mantine/core';
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
    <Container maw={800} mx="auto">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Container>
  );
}

export default App
