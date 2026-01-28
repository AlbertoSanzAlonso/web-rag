import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupPage from './pages/Setup';
import ChatPage from './pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
