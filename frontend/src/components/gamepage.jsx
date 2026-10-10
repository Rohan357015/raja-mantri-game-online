import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/game.store";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import "./styles/gamepage.css";

const TIME_LIMIT = 150;

const ROLES = {
  raja: { label: "Raja", icon: "🤴" },
  mantri: { label: "Mantri", icon: "🧙" },
  chor: { label: "Chor", icon: "🦹" },
  sipahi: { label: "Sipahi", icon: "💂" },
};


/* ======================================================
   Pixar-style SVG characters (no image files needed)
   ====================================================== */
const SkinDefs = ({ id, light, dark }) => (
  <radialGradient id={`${id}-skin`} cx="0.38" cy="0.3" r="0.85">
    <stop offset="0" stopColor={light} />
    <stop offset="1" stopColor={dark} />
  </radialGradient>
);

const GoldDef = () => (
  <linearGradient id="px-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#fff3a8" />
    <stop offset="0.5" stopColor="#f5bd35" />
    <stop offset="1" stopColor="#b97a14" />
  </linearGradient>
);

const Face = ({ id, sly = false, iris = "#5b3a1a", smile = "open" }) => (
  <g>
    <ellipse cx="29" cy="60" rx="5" ry="7.5" fill={`url(#${id}-skin)`} />
    <ellipse cx="91" cy="60" rx="5" ry="7.5" fill={`url(#${id}-skin)`} />
    <circle cx="60" cy="58" r="31" fill={`url(#${id}-skin)`} />
    {/* glossy highlight */}
    <ellipse cx="46" cy="38" rx="11" ry="6" fill="#fff" opacity="0.22" transform="rotate(-25 46 38)" />
    {/* cheeks */}
    <ellipse cx="41" cy="69" rx="6.5" ry="4.2" fill="#ff7a8a" opacity="0.45" />
    <ellipse cx="79" cy="69" rx="6.5" ry="4.2" fill="#ff7a8a" opacity="0.45" />
    {/* eyes */}
    {[49, 71].map((x, i) => (
      <g key={x}>
        <ellipse cx={x} cy="58" rx="7.6" ry="9" fill="#fff" stroke="#00000030" strokeWidth="0.6" />
        <circle cx={x + (i ? -0.6 : 0.6)} cy="59" r="5.4" fill={iris} />
        <circle cx={x + (i ? -0.6 : 0.6)} cy="59" r="3" fill="#150a04" />
        <circle cx={x + 1.9} cy="55.6" r="2.2" fill="#fff" />
        <circle cx={x - 1.5} cy="62" r="1" fill="#fff" opacity="0.85" />
      </g>
    ))}
    {/* brows */}
    <path
      d={sly ? "M39 44 Q47 44 57 50" : "M40 46 Q48 41 56 46"}
      stroke="#3a2412" strokeWidth="3" strokeLinecap="round" fill="none"
    />
    <path
      d={sly ? "M63 50 Q73 44 81 44" : "M64 46 Q72 41 80 46"}
      stroke="#3a2412" strokeWidth="3" strokeLinecap="round" fill="none"
    />
    {/* nose */}
    <ellipse cx="60" cy="67" rx="3.8" ry="3.2" fill="#000" opacity="0.1" />
    <ellipse cx="59" cy="66" rx="2.6" ry="2" fill="#fff" opacity="0.3" />
    {/* mouth */}
    {smile === "open" && (
      <g>
        <path d="M49 75 Q60 90 71 75 Q60 78 49 75 Z" fill="#7a1f24" />
        <path d="M52 76 Q60 79 68 76 L67 78.5 Q60 81 53 78.5 Z" fill="#fff" />
      </g>
    )}
    {smile === "sly" && (
      <g>
        <path d="M48 76 Q60 86 74 72" stroke="#6a1a20" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <rect x="60" y="78" width="4" height="4.5" rx="1" fill="#fff" stroke="#6a1a20" strokeWidth="0.6" />
      </g>
    )}
  </g>
);

const Stache = ({ color = "#2a1a10", y = 72 }) => (
  <g fill={color}>
    <path d={`M42 ${y + 2} Q40 ${y - 7} 53 ${y - 3} Q60 ${y - 1} 67 ${y - 3} Q80 ${y - 7} 78 ${y + 2} Q72 ${y + 7} 60 ${y + 1} Q48 ${y + 7} 42 ${y + 2} Z`} />
    <path d={`M42 ${y + 2} Q36 ${y + 4} 37 ${y - 3}`} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d={`M78 ${y + 2} Q84 ${y + 4} 83 ${y - 3}`} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
  </g>
);

const Raja = () => (
  <svg viewBox="0 0 120 150" className="gp-char" aria-hidden="true">
    <defs>
      <SkinDefs id="raja" light="#ffd9b0" dark="#eaa56d" />
      <GoldDef />
      <linearGradient id="raja-robe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0554a" />
        <stop offset="1" stopColor="#a1201f" />
      </linearGradient>
    </defs>
    {/* robe */}
    <path d="M10 150 Q12 98 60 94 Q108 98 110 150 Z" fill="url(#raja-robe)" />
    <path d="M52 100 L60 150 L68 100 Z" fill="url(#px-gold)" opacity="0.9" />
    {/* ermine collar */}
    <ellipse cx="60" cy="97" rx="32" ry="9" fill="#fffaf0" />
    {[34, 44, 54, 66, 76, 86].map((x) => (
      <circle key={x} cx={x} cy="100" r="1.4" fill="#2b2b2b" />
    ))}
    <circle cx="60" cy="112" r="6" fill="url(#px-gold)" stroke="#8a5410" strokeWidth="1" />
    <circle cx="60" cy="112" r="2.5" fill="#3d82e8" />
    <Face id="raja" />
    <Stache color="#1e140d" />
    <path d="M54 86 Q60 92 66 86 Q60 88 54 86Z" fill="#1e140d" />
    {/* crown */}
    <path d="M34 40 L36 14 L48 28 L60 6 L72 28 L84 14 L86 40 Q60 47 34 40 Z" fill="url(#px-gold)" stroke="#8a5410" strokeWidth="1.2" />
    <path d="M35 36 Q60 43 85 36" stroke="#b97a14" strokeWidth="3" fill="none" />
    <circle cx="36" cy="13" r="3.2" fill="#e8483f" /><circle cx="60" cy="6" r="3.6" fill="#3d82e8" />
    <circle cx="84" cy="13" r="3.2" fill="#e8483f" />
    <circle cx="48" cy="36" r="2.6" fill="#5fc04a" /><circle cx="60" cy="38" r="2.8" fill="#e8483f" />
    <circle cx="72" cy="36" r="2.6" fill="#5fc04a" />
    <path d="M40 22 Q44 16 46 22" stroke="#fff" strokeWidth="1.6" opacity="0.7" fill="none" strokeLinecap="round" />
  </svg>
);

const Mantri = () => (
  <svg viewBox="0 0 120 150" className="gp-char" aria-hidden="true">
    <defs>
      <SkinDefs id="mantri" light="#e9b384" dark="#c27f4c" />
      <GoldDef />
      <linearGradient id="mantri-robe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3fbf8c" />
        <stop offset="1" stopColor="#176b57" />
      </linearGradient>
      <linearGradient id="mantri-turban" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4aa0ff" />
        <stop offset="1" stopColor="#1f45b8" />
      </linearGradient>
    </defs>
    <path d="M10 150 Q12 98 60 94 Q108 98 110 150 Z" fill="url(#mantri-robe)" />
    <path d="M30 104 Q60 118 90 104" stroke="url(#px-gold)" strokeWidth="5" fill="none" />
    {/* scroll */}
    <g transform="rotate(-14 94 126)">
      <rect x="82" y="112" width="26" height="30" rx="3" fill="#fff6dc" stroke="#b98a3c" strokeWidth="1.2" />
      <rect x="79" y="110" width="32" height="6" rx="3" fill="#d9a441" />
      <rect x="79" y="138" width="32" height="6" rx="3" fill="#d9a441" />
      <path d="M86 122h18M86 127h18M86 132h12" stroke="#b98a3c" strokeWidth="1.4" strokeLinecap="round" />
    </g>
    <Face id="mantri" iris="#3b2412" />
    <Stache color="#4a2d18" y={73} />
    {/* turban */}
    <path d="M29 48 Q26 14 60 12 Q94 14 91 48 Q60 36 29 48 Z" fill="url(#mantri-turban)" stroke="#16236b" strokeWidth="1.2" />
    <path d="M32 38 Q60 24 88 38 M34 29 Q60 16 86 29" stroke="#fff" strokeWidth="1.6" opacity="0.4" fill="none" />
    <path d="M30 46 Q60 38 90 46" stroke="url(#px-gold)" strokeWidth="4" fill="none" />
    <circle cx="60" cy="31" r="5" fill="url(#px-gold)" stroke="#8a5410" />
    <circle cx="60" cy="31" r="2.2" fill="#e8483f" />
    {/* feather */}
    <path d="M62 27 Q82 -2 104 4 Q92 22 70 30 Z" fill="#ff7fb2" stroke="#c23d7a" strokeWidth="1" />
    <path d="M66 28 Q84 12 100 6" stroke="#fff" strokeWidth="1.3" opacity="0.7" fill="none" />
  </svg>
);

const Chor = () => (
  <svg viewBox="0 0 120 150" className="gp-char" aria-hidden="true">
    <defs>
      <SkinDefs id="chor" light="#f6cfa8" dark="#d99a68" />
      <linearGradient id="chor-cap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4c4c5e" />
        <stop offset="1" stopColor="#1e1e2a" />
      </linearGradient>
      <pattern id="chor-stripe" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#2b2b36" />
        <rect y="0" width="14" height="6" fill="#f3f3f3" />
      </pattern>
    </defs>
    {/* sack */}
    <g transform="rotate(14 98 118)">
      <path d="M84 104 Q80 142 98 146 Q118 142 112 104 Q98 98 84 104 Z" fill="#c9a064" stroke="#7a5a22" strokeWidth="1.4" />
      <path d="M86 106 Q98 112 110 106" stroke="#7a5a22" strokeWidth="3" fill="none" />
      <text x="98" y="134" textAnchor="middle" fontSize="18" fontWeight="900" fill="#5a3a10">₹</text>
    </g>
    <path d="M12 150 Q14 98 60 94 Q106 98 108 150 Z" fill="url(#chor-stripe)" />
    <path d="M12 150 Q14 98 60 94 Q106 98 108 150 Z" fill="none" stroke="#111" strokeWidth="1.4" />
    <path d="M44 96 Q60 108 76 96 L72 92 Q60 98 48 92 Z" fill="#d8392f" />
    <Face id="chor" sly smile="sly" iris="#2d6a3a" />
    {/* eye mask */}
    <path d="M30 50 Q60 44 90 50 L90 64 Q76 70 68 64 Q60 60 52 64 Q44 70 30 64 Z" fill="#14141c" opacity="0.92" />
    {[49, 71].map((x, i) => (
      <g key={x}>
        <ellipse cx={x} cy="58" rx="6" ry="6.4" fill="#fff" />
        <circle cx={x + (i ? -0.8 : 0.8)} cy="58.6" r="3.9" fill="#2d6a3a" />
        <circle cx={x + (i ? -0.8 : 0.8)} cy="58.6" r="2.1" fill="#0a0a0a" />
        <circle cx={x + 1.3} cy="56.4" r="1.5" fill="#fff" />
      </g>
    ))}
    {/* cap */}
    <path d="M28 46 Q28 12 60 12 Q92 12 92 46 Q60 38 28 46 Z" fill="url(#chor-cap)" stroke="#0c0c12" strokeWidth="1.2" />
    <path d="M30 40 Q60 31 90 40" stroke="#d8392f" strokeWidth="5" fill="none" />
    <circle cx="60" cy="9" r="5" fill="#d8392f" />
    <path d="M42 22 Q48 15 56 17" stroke="#fff" strokeWidth="1.6" opacity="0.3" fill="none" strokeLinecap="round" />
  </svg>
);

const Sipahi = () => (
  <svg viewBox="0 0 120 150" className="gp-char" aria-hidden="true">
    <defs>
      <SkinDefs id="sipahi" light="#f0bf90" dark="#cf8f58" />
      <GoldDef />
      <linearGradient id="sipahi-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f2f6fb" />
        <stop offset="0.5" stopColor="#a9b6c6" />
        <stop offset="1" stopColor="#68768a" />
      </linearGradient>
      <linearGradient id="sipahi-armor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4d8ff0" />
        <stop offset="1" stopColor="#1d3f9c" />
      </linearGradient>
    </defs>
    <path d="M10 150 Q12 98 60 94 Q108 98 110 150 Z" fill="url(#sipahi-armor)" />
    <ellipse cx="22" cy="104" rx="14" ry="9" fill="url(#sipahi-steel)" stroke="#4a5568" strokeWidth="1" />
    <ellipse cx="98" cy="104" rx="14" ry="9" fill="url(#sipahi-steel)" stroke="#4a5568" strokeWidth="1" />
    <path d="M60 98 V150" stroke="url(#px-gold)" strokeWidth="3" />
    {[110, 124, 138].map((y) => (
      <circle key={y} cx="60" cy={y} r="3.2" fill="url(#px-gold)" stroke="#8a5410" strokeWidth="0.8" />
    ))}
    {/* shield */}
    <path d="M6 112 H34 V132 Q20 148 6 132 Z" fill="url(#sipahi-steel)" stroke="#4a5568" strokeWidth="1.4" />
    <path d="M20 116 V138 M10 124 H30" stroke="#d8392f" strokeWidth="3.4" />
    <Face id="sipahi" iris="#3b2412" />
    <Stache color="#5a3418" y={73} />
    {/* helmet */}
    <path d="M27 50 Q26 10 60 9 Q94 10 93 50 L88 46 Q60 36 32 46 Z" fill="url(#sipahi-steel)" stroke="#4a5568" strokeWidth="1.4" />
    <path d="M29 44 Q60 33 91 44" stroke="url(#px-gold)" strokeWidth="4.5" fill="none" />
    <rect x="56" y="38" width="8" height="22" rx="3" fill="url(#sipahi-steel)" stroke="#4a5568" strokeWidth="1" />
    <ellipse cx="46" cy="22" rx="10" ry="5" fill="#fff" opacity="0.4" transform="rotate(-30 46 22)" />
    {/* plume */}
    <path d="M60 10 Q52 -6 70 -4 Q84 -2 74 12 Q68 8 60 10 Z" fill="#e8483f" stroke="#a1201f" strokeWidth="1" />
  </svg>
);

const CHARACTERS = { raja: Raja, mantri: Mantri, chor: Chor, sipahi: Sipahi };

const Character = ({ role }) => {
  const C = CHARACTERS[role];
  return C ? <C /> : <span className="gp-char-fallback">🎴</span>;
};

/* ======================================================
   Animated storybook scenery
   ====================================================== */
const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  size: `${4 + (i % 4) * 2}px`,
  delay: `${(i * 0.9) % 8}s`,
  dur: `${7 + (i % 5) * 1.6}s`,
}));

const Scenery = () => (
  <div className="gp-scenery" aria-hidden="true">
    <div className="gp-rays" />
    <div className="gp-sun" />

    <span className="gp-cloud c1" />
    <span className="gp-cloud c2" />
    <span className="gp-cloud c3" />

    {/* far mountains */}
    <svg className="gp-mountains" viewBox="0 0 1200 300" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mt-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b9ee" /><stop offset="1" stopColor="#d6dcf7" />
        </linearGradient>
        <linearGradient id="mt-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa6e6" /><stop offset="1" stopColor="#c4cff3" />
        </linearGradient>
      </defs>
      <path d="M0 300 L0 170 L140 60 L260 170 L380 90 L520 190 L660 50 L800 180 L930 80 L1060 170 L1200 100 L1200 300 Z" fill="url(#mt-a)" opacity="0.8" />
      <path d="M0 300 L0 220 L180 130 L320 220 L470 140 L620 230 L780 120 L940 230 L1090 150 L1200 220 L1200 300 Z" fill="url(#mt-b)" />
    </svg>

    {/* rolling hills */}
    <svg className="gp-hills" viewBox="0 0 1200 160" preserveAspectRatio="none">
      <path d="M0 160 V70 Q150 10 320 60 T640 50 T960 60 T1200 40 V160 Z" fill="#7fd36a" />
      <path d="M0 160 V110 Q200 60 400 100 T800 95 T1200 90 V160 Z" fill="#4fb353" />
    </svg>

    {/* fairy-tale castle */}
    <svg className="gp-castle-svg" viewBox="0 0 360 300">
      <defs>
        <linearGradient id="c-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbeed6" /><stop offset="1" stopColor="#e2c79c" />
        </linearGradient>
        <linearGradient id="c-roof-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9b6bf0" /><stop offset="1" stopColor="#5a34b0" />
        </linearGradient>
        <linearGradient id="c-roof-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7fa8" /><stop offset="1" stopColor="#c23a73" />
        </linearGradient>
      </defs>
      {/* side turrets */}
      <rect x="14" y="190" width="38" height="90" fill="url(#c-wall)" />
      <path d="M8 192 L33 128 L58 192 Z" fill="url(#c-roof-b)" />
      <rect x="308" y="190" width="38" height="90" fill="url(#c-wall)" />
      <path d="M302 192 L327 128 L352 192 Z" fill="url(#c-roof-b)" />
      {/* towers */}
      <rect x="60" y="150" width="62" height="130" fill="url(#c-wall)" />
      <path d="M52 152 L91 76 L130 152 Z" fill="url(#c-roof-a)" />
      <rect x="238" y="150" width="62" height="130" fill="url(#c-wall)" />
      <path d="M230 152 L269 76 L308 152 Z" fill="url(#c-roof-a)" />
      {/* keep */}
      <rect x="118" y="116" width="124" height="164" fill="url(#c-wall)" />
      <path d="M106 118 L180 22 L254 118 Z" fill="url(#c-roof-b)" />
      <path d="M180 22 V0" stroke="#7a4a1a" strokeWidth="3" />
      <path className="gp-flag" d="M180 2 L206 10 L180 18 Z" fill="#ffd34d" stroke="#b97a14" />
      <path d="M91 76 V58" stroke="#7a4a1a" strokeWidth="2.5" />
      <path className="gp-flag" d="M91 58 L110 64 L91 70 Z" fill="#e8483f" />
      <path d="M269 76 V58" stroke="#7a4a1a" strokeWidth="2.5" />
      <path className="gp-flag" d="M269 58 L288 64 L269 70 Z" fill="#e8483f" />
      {/* gate + windows */}
      <path d="M154 280 V240 Q180 206 206 240 V280 Z" fill="#5b3418" stroke="#f2b640" strokeWidth="3" />
      {[[91, 190], [269, 190], [180, 150], [140, 150], [220, 150]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 7} ${y + 22} V${y + 8} Q${x} ${y - 6} ${x + 7} ${y + 8} V${y + 22} Z`} fill="#ffe27a" stroke="#b97a14" strokeWidth="1.5" />
      ))}
      <path d="M0 280 H360" stroke="#c9a56a" strokeWidth="6" />
    </svg>

    {/* bunting */}
    <svg className="gp-bunting" viewBox="0 0 1200 70" preserveAspectRatio="none">
      <defs>
        <pattern id="flags" width="240" height="60" patternUnits="userSpaceOnUse">
          <path d="M8 8 L56 8 L32 52 Z" fill="#e8483f" />
          <path d="M68 8 L116 8 L92 52 Z" fill="#ffd34d" />
          <path d="M128 8 L176 8 L152 52 Z" fill="#4aa0ff" />
          <path d="M188 8 L236 8 L212 52 Z" fill="#5fc04a" />
        </pattern>
      </defs>
      <rect x="0" y="6" width="1200" height="54" fill="url(#flags)" />
      <path d="M0 8 Q600 22 1200 8" stroke="#8a5410" strokeWidth="3" fill="none" />
    </svg>

    {/* curtains */}
    <div className="gp-curtain left" />
    <div className="gp-curtain right" />

    <div className="gp-pillar left" />
    <div className="gp-pillar right" />
    <div className="gp-carpet" />

    {/* floating sparkles */}
    {SPARKLES.map((s, i) => (
      <i
        key={i}
        className="gp-sparkle"
        style={{
          left: s.left,
          width: s.size,
          height: s.size,
          animationDelay: s.delay,
          animationDuration: s.dur,
        }}
      />
    ))}
    <div className="gp-vignette" />
  </div>
);

const GamePlay = () => {
  const navigate = useNavigate();
  const { roomCode, room, user, initSocket, clearRoom } = useAuthStore();
  const {
    game,
    loading,
    initGameSocket,
    makeGuess,
    calculateScores,
    nextRound,
    playAgain,
    getLeaderboard,
  } = useGameStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreTab, setScoreTab] = useState("leaderboard");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [chatInput, setChatInput] = useState("");

  const {
    messages: chatMessages,
    initChatSocket,
    loadMessages,
    sendMessage,
    clearMessages,
  } = useChatStore();

  const playerId = user?.user;
  const isHost = Boolean(user?.isHost);
  const leaderboard = getLeaderboard() || [];
  const totalRounds = game?.totalRounds || room?.round || 0;
  const currentRound = game?.currentRound || 1;

  const latestResult = game?.roundResults?.length
    ? game.roundResults[game.roundResults.length - 1]
    : null;

  useEffect(() => {
    initSocket();
    initGameSocket();
    initChatSocket(); // listens for "room-chat-message" (only attaches once)
  }, [initSocket, initGameSocket, initChatSocket]);

  // load saved chat history for this room from localStorage
  useEffect(() => {
    if (roomCode) loadMessages(roomCode);
  }, [roomCode, loadMessages]);

  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    if (game?.phase !== "card-distribution") return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.phase, game?.currentRound]);

  // keep the chat scrolled to the newest message
  useEffect(() => {
    const el = document.getElementById("gp-chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

  const handleGuess = async (targetId) => {
    if (
      !roomCode ||
      !playerId ||
      loading ||
      timeLeft <= 0 ||
      !game?.canCurrentPlayerGuess
    ) {
      return;
    }
    await makeGuess(roomCode, targetId, playerId);
  };

  const myName =
    user?.name ||
    user?.username ||
    game?.players?.find((player) => player._id === playerId)?.name ||
    "Player";

  const handleSendMessage = (event) => {
    event.preventDefault();

    const text = chatInput.trim();
    if (!text || !roomCode) return;

    // The server broadcasts the message back to everyone (including the sender),
    // and the chat store adds it to the list, so no local append is needed.
    sendMessage({ roomCode, senderId: playerId, senderName: myName, text });
    setChatInput("");
  };

  const formatChatTime = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const leaveGame = () => {
    clearMessages(roomCode);
    clearRoom();
    navigate("/");
  };

  const renderCard = (card) => {
    // Never show hidden role data before the card is revealed.
    const role = card.isRevealed ? card.role || card.actualRole : null;
    const meta = ROLES[role] || { label: "Hidden Role", icon: "🎴" };

    const clickable = Boolean(
      game?.phase === "card-distribution" &&
        game?.canCurrentPlayerGuess &&
        card.isGuessable &&
        !game?.sipahiGuess &&
        timeLeft > 0 &&
        !loading
    );

    const isMe = card.playerId === playerId;

    return (
      <button
        key={card.playerId}
        type="button"
        className={`gp-card ${clickable ? "can-guess" : ""} ${
          isMe ? "my-card" : ""
        } ${card.isRevealed ? "is-revealed" : ""}`}
        onClick={() => clickable && handleGuess(card.playerId)}
        disabled={!clickable}
        aria-label={`Player ${card.playerName}`}
      >
        <span className="gp-card-name">
          {card.playerName}
          {isMe && <small>YOU</small>}
        </span>

        {card.isRevealed ? (
          <span className={`gp-card-face gp-card-front role-${role || "hidden"}`}>
            <span className="gp-card-art">
              <Character role={role} />
            </span>
            <span className={`gp-card-ribbon chip-${role || "hidden"}`}>
              {meta.label}
            </span>
          </span>
        ) : (
          <span className="gp-card-face gp-card-back">
            <span className="gp-card-crown">♛</span>
            {clickable && <span className="gp-guess-hint">Tap to Guess</span>}
          </span>
        )}
      </button>
    );
  };

  const resultsPanel = latestResult ? (
    <div className="gp-round-results">
      <h3>Round {latestResult.round} Results</h3>
      {(latestResult.results || []).map((item, index) => (
        <div className="gp-round-row" key={`${item.playerName}-${item.role}-${index}`}>
          <span className="gp-round-name">{item.playerName}</span>
          <span className={`gp-chip chip-${item.role}`}>
            {ROLES[item.role]?.label || item.role}
          </span>
          <b className={item.points < 0 ? "neg" : item.points > 0 ? "pos" : ""}>
            {item.points > 0 ? "+" : ""}
            {item.points}
          </b>
          <small>Total: {item.totalPoints}</small>
        </div>
      ))}
    </div>
  ) : (
    <p className="gp-empty">Round results will appear after the first round.</p>
  );

  const rankingsPanel = (
    <div className="gp-rankings">
      {leaderboard.length ? (
        leaderboard.map((player) => (
          <div className={`gp-score-row rank-${player.rank}`} key={player._id}>
            <span className="gp-medal">
              {player.rank === 1
                ? "👑"
                : player.rank === 2
                ? "🥈"
                : player.rank === 3
                ? "🥉"
                : `#${player.rank}`}
            </span>
            <span className="gp-score-name">
              {player.name}
              {player._id === playerId && <small>YOU</small>}
              {game?.phase === "game-finished" && (
                <small>{game?.finalRanks?.[player.rank - 1]?.title || ""}</small>
              )}
            </span>
            <b>{player.points} pts</b>
          </div>
        ))
      ) : (
        <p className="gp-empty">Scores will appear here as the game progresses.</p>
      )}
    </div>
  );

  return (
    <main className="gp-root">
      <Scenery />

      {/* ---------- header ---------- */}
      <header className="gp-header">
        <div className="gp-logo">
          <span className="gp-logo-top">Raja Mantri</span>
          <strong>Chor Sipahi</strong>
        </div>

        <div className="gp-status">
          <span>
            Room: <b>{roomCode || "------"}</b>
          </span>
          <span>
            Round <b>{currentRound}</b> / {totalRounds}
          </span>
          <span className="gp-status-phase">
            Phase: <b>{(game?.phase || "Loading").replaceAll("-", " ")}</b>
          </span>
        </div>

        <div className="gp-menu-wrap">
          <button
            type="button"
            className="gp-menu-btn"
            aria-label="Open game menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="gp-dismiss"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <nav className="gp-menu">
                <button
                  type="button"
                  onClick={() => {
                    setScoreOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <span className="gp-menu-icon">🏆</span>
                  Score Card
                  <i>›</i>
                </button>
                <button type="button" onClick={() => navigate("/")}>
                  <span className="gp-menu-icon">🏰</span>
                  Home
                  <i>›</i>
                </button>
                <button type="button" className="leave" onClick={leaveGame}>
                  <span className="gp-menu-icon">🚪</span>
                  Leave Game
                </button>
              </nav>
            </>
          )}
        </div>
      </header>

      {/* ---------- stage ---------- */}
      <section className="gp-stage">
        <div className="gp-top-row">
          <div
            className={`gp-timer ${timeLeft <= 30 ? "danger" : ""}`}
            style={{ "--pct": `${(timeLeft / TIME_LIMIT) * 360}deg` }}
          >
            <div className="gp-timer-inner">
              <span className="gp-timer-value">{formatTime(timeLeft)}</span>
              <span className="gp-timer-sub">
                {timeLeft === 0 ? (
                  "Time is up!"
                ) : (
                  <>
                    Time to find
                    <br />
                    the <b>Chor!</b>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="gp-hint">
            <span className="gp-hint-mascot"><Character role="sipahi" /></span>
            <p>
              {game?.canCurrentPlayerGuess
                ? "You are the Sipahi! Tap a hidden card to guess the Chor."
                : "If you are the Sipahi, tap a hidden card to guess the Chor."}
            </p>
          </div>
        </div>

        <div className="gp-cards">{(game?.cards || []).map(renderCard)}</div>

        {/* phase actions */}
        {game?.phase === "card-distribution" && timeLeft === 0 && (
          <p className="gp-banner">⏰ Guessing time has ended.</p>
        )}

        {game?.phase === "reveal" && (
          <div className="gp-banner action">
            <h2>
              {game?.sipahiGuess?.isCorrect ? "🎉 Correct Guess!" : "😮 Wrong Guess!"}
            </h2>
            {isHost ? (
              <button
                type="button"
                className="gp-btn"
                onClick={() => calculateScores(roomCode)}
                disabled={loading}
              >
                {loading ? "Calculating..." : "Calculate Round Score"}
              </button>
            ) : (
              <p>Waiting for the host to calculate the score.</p>
            )}
          </div>
        )}

        {game?.phase === "round-complete" && (
          <div className="gp-banner action">
            <h2>🎊 Round Complete!</h2>
            <div className="gp-banner-buttons">
              <button type="button" className="gp-btn alt" onClick={() => setScoreOpen(true)}>
                Score Card
              </button>
              {isHost && (
                <button
                  type="button"
                  className="gp-btn"
                  onClick={() => nextRound(roomCode)}
                  disabled={loading}
                >
                  {loading ? "Shuffling..." : "Start Next Round"}
                </button>
              )}
            </div>
          </div>
        )}

        {game?.phase === "game-finished" && (
          <div className="gp-banner action">
            <h2>
              👑 Champion: {game?.finalRanks?.[0]?.playerName || "Champion"}
            </h2>
            <div className="gp-banner-buttons">
              <button type="button" className="gp-btn alt" onClick={() => setScoreOpen(true)}>
                View Score Card
              </button>
              {isHost && (
                <button
                  type="button"
                  className="gp-btn"
                  onClick={() => playAgain(roomCode)}
                  disabled={loading}
                >
                  {loading ? "Starting..." : "Play Again"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------- chat ---------- */}
      <section className="gp-chat">
        <header className="gp-chat-head">
          <span>
            <i className="gp-star">✦</i> Kingdom Chat
          </span>
          <span className="gp-chat-status">
            <i /> Live
          </span>
        </header>

        <div className="gp-chat-scroll" id="gp-chat-scroll" aria-live="polite">
          <div className="gp-msg bot">
            <span className="gp-avatar">👑</span>
            <div className="gp-bubble">
              <strong>Game Bot</strong>
              <p>Round started! Find the Chor. Good luck!</p>
            </div>
          </div>

          {chatMessages.map((message) => {
            const mine = message.senderId === playerId;
            return (
              <div className={`gp-msg ${mine ? "mine" : ""}`} key={message.id}>
                <span className="gp-avatar">
                  {(message.senderName || "P").charAt(0).toUpperCase()}
                </span>
                <div className="gp-bubble">
                  <strong>
                    {mine ? "You" : message.senderName}
                    <time>{formatChatTime(message.createdAt)}</time>
                  </strong>
                  <p>{message.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <form className="gp-chat-form" onSubmit={handleSendMessage}>
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            aria-label="Chat message"
          />
          <button type="submit" disabled={!chatInput.trim()} aria-label="Send message">
            ➤
          </button>
        </form>
      </section>

      {/* ---------- score card ---------- */}
      {scoreOpen && (
        <div className="gp-overlay">
          <button
            type="button"
            className="gp-dismiss dark"
            aria-label="Close score card"
            onClick={() => setScoreOpen(false)}
          />

          <div className="gp-score" role="dialog" aria-modal="true" aria-label="Score card">
            <header className="gp-score-head">
              <h2>🏆 Score Card</h2>
              <p>
                Round {currentRound} / {totalRounds}
              </p>
              <button type="button" onClick={() => setScoreOpen(false)} aria-label="Close score card">
                ×
              </button>
            </header>

            <div className="gp-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={scoreTab === "leaderboard"}
                className={scoreTab === "leaderboard" ? "active" : ""}
                onClick={() => setScoreTab("leaderboard")}
              >
                Leaderboard
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scoreTab === "results"}
                className={scoreTab === "results" ? "active" : ""}
                onClick={() => setScoreTab("results")}
              >
                Round Results
              </button>
            </div>

            <div className={`gp-score-body show-${scoreTab}`}>
              <div className="gp-pane pane-leaderboard">{rankingsPanel}</div>
              <div className="gp-pane pane-results">{resultsPanel}</div>
            </div>

            <button type="button" className="gp-btn wide" onClick={() => setScoreOpen(false)}>
              Back to Game
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default GamePlay;