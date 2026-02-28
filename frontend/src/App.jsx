  import { Routes, Route } from "react-router-dom";
  import Homepage from "./components/homepage.jsx";
  import CreateRoom from "./components/createroom.jsx";
  import JoinRoom from "./components/joinroom.jsx";
  import GetRoom from "./components/getroom.jsx";
  import GamePlay from "./components/gamepage.jsx";

  function App() {
    return (
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/get-room" element={<GetRoom />} />
        <Route path="/start-game" element={<GamePlay />} />
      </Routes>
    );
  }

  export default App;
