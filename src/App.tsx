import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/login/Login';
import LoginTOTP from './components/login/LoginTOTP';
import Words from './components/words/Words';
import Practice from './components/practice/Practice';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/totp" element={<LoginTOTP />} />
        <Route path="/words" element={<Words />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/" element={<Navigate replace to="/practice" />} />
      </Routes>
    </Router>
  );
}

export default App;
