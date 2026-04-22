import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import sceneImg from "@/assets/proposal-scene.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bahbek ya Marigona 💖" },
      { name: "description", content: "Bahbek ya Marigona — a romantic playful proposal 💖" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"propose" | "yes">("propose");
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [tryAgain, setTryAgain] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roomLink, setRoomLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Floating decorations
  const floaters = Array.from({ length: 24 }).map((_, i) => {
    const symbols = ["💖", "🌹", "🌸", "💘", "💗", "🌷", "💓"];
    const s = symbols[i % symbols.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = 8 + Math.random() * 10;
    const size = 16 + Math.random() * 22;
    return (
      <span
        key={i}
        className="floater"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          fontSize: `${size}px`,
        }}
      >
        {s}
      </span>
    );
  });

  function moveNo() {
    const isMobile = window.innerWidth < 640;
    const padX = isMobile ? 20 : 80;
    const padY = isMobile ? 20 : 80;
    const btnW = isMobile ? 110 : 160;
    const btnH = 60;
    const w = Math.max(50, window.innerWidth - padX * 2 - btnW);
    const h = Math.max(120, window.innerHeight - padY * 2 - btnH);
    setNoPos({
      x: padX + Math.random() * w,
      y: padY + 60 + Math.random() * h,
    });
    setTryAgain(true);
    window.setTimeout(() => setTryAgain(false), 1500);
  }

  function handleYes() {
    try {
      const Ctx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f;
          o.type = "sine";
          o.connect(g);
          g.connect(ctx.destination);
          const t = ctx.currentTime + i * 0.18;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.25, t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          o.start(t);
          o.stop(t + 0.55);
        });
      }
    } catch {
      /* ignore */
    }
    setStage("yes");
  }

  async function createRoom() {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("game_rooms")
        .insert({})
        .select("id")
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/room/${data.id}`;
      setRoomLink(link);
    } catch (e) {
      console.error(e);
      alert("Couldn't create the room. Please try again 💔");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!roomLink) return;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function shareWhatsApp() {
    if (!roomLink) return;
    const text = `Habibi 💖 join our love game: ${roomLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function openRoom() {
    if (!roomLink) return;
    const id = roomLink.split("/room/")[1];
    navigate({ to: "/room/$id", params: { id } });
  }

  const burst = stage === "yes"
    ? Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const dur = 2 + Math.random() * 2;
        const sym = ["💖", "✨", "🌹", "💗", "💘"][i % 5];
        return (
          <span
            key={i}
            className="burst"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              fontSize: `${20 + Math.random() * 26}px`,
            }}
          >
            {sym}
          </span>
        );
      })
    : null;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="romantic-root">
      <style>{css}</style>

      <div className="floaters">{floaters}</div>

      {stage === "propose" && (
        <main className="stage propose-stage">
          <h1 className="glow-title">
            <span className="line ar" dir="rtl">تتجوزيني يا ماريجونا؟ 💍</span>
            <span className="line tiny">(Egyptian Arabic: Will you marry me, Marigona?)</span>
            <span className="line">Will you marry me, Marigona?</span>
            <span className="line">Willst du mich heiraten, Marigona?</span>
            <span className="line">A martohesh me mua, Marigona?</span>
          </h1>

          <img
            src={sceneImg}
            alt="Anime proposal scene"
            className="scene"
            width={1024}
            height={1024}
          />

          <div className="buttons">
            <button className="btn yes" onClick={handleYes}>
              YES 💖
            </button>
            <button
              className="btn no"
              style={
                noPos
                  ? { position: "fixed", left: noPos.x, top: noPos.y, zIndex: 40 }
                  : undefined
              }
              onMouseEnter={moveNo}
              onTouchStart={(e) => {
                e.preventDefault();
                moveNo();
              }}
              onClick={(e) => {
                e.preventDefault();
                moveNo();
              }}
            >
              NO 🙈
            </button>
          </div>

          {tryAgain && (
            <div
              className="popup"
              style={{
                left: Math.min((noPos?.x ?? window.innerWidth / 2) + 20, window.innerWidth - 200),
                top: Math.max(60, (noPos?.y ?? window.innerHeight / 2) - 50),
              }}
            >
              <span className="popup-emoji">🫣</span>
              <div className="popup-text">
                <span dir="rtl">حاولي تاني</span>
                <small>(Try again)</small>
              </div>
            </div>
          )}
        </main>
      )}

      {stage === "yes" && (
        <main className="stage yes-stage">
          <div className="burst-layer">{burst}</div>
          <h1 className="love-title">
            <span className="love-line">I love youuuuuu roohiiiiiiiii 💖</span>
            <span className="love-line ar" dir="rtl">بحبكككك يا روحيييييي 💖</span>
            <span className="love-line tiny">(Egyptian Arabic: I love youuuu my souuull 💖)</span>
            <span className="love-line">Ich liebe dichhhhh meine Seeleeeee 💖</span>
            <span className="love-line">Të dua shuuuumë shpirti immmm 💖</span>
          </h1>

          <article className="letter">
            <p>i dont even know how to explain what i feel but ill try cause u deserve to hear it 💌</p>
            <p>i love u so much more than words can ever say and every day i feel it more and more</p>
            <p><strong>Marigona</strong> u are not just someone in my life u are my whole life</p>
            <p>u are my smile my peace my calm u are the only place i run to when everything feels heavy</p>
            <p>when i talk to u everything changes my mood my day my whole world becomes lighter just because of u</p>
            <p>i swear i dont see anyone else i dont even look at anyone else cause i dont want anyone but u</p>
            <p>u are enough for me more than enough u are everything i ever wanted and more 🌹</p>
            <p>ur beauty is not just how u look even tho u are the most beautiful girl i ever saw</p>
            <p>but its ur heart ur soul ur way ur softness everything about u makes me fall for u again and again</p>
            <p><span className="ar" dir="rtl">حبيبتي</span> <em>(habibti — my love)</em> sometimes i just sit and think how lucky i am to have u</p>
            <p>like how did life give me someone like u someone so pure so kind so real</p>
            <p>u are something rare something that doesnt repeat in this world ✨</p>
            <p><span className="ar" dir="rtl">قلبي</span> <em>(albi — my heart)</em> when im with u i feel safe i feel calm i feel like i finally found my place</p>
            <p>and without u everything feels empty and quiet in a way i dont like</p>
            <p>u became part of me part of my day part of my thoughts part of everything</p>
            <p>Marigona i cant imagine my future without u in it</p>
            <p>i see u in everything i plan i see u next to me always</p>
            <p>u are the one i want to build my life with step by step 💍</p>
            <p>the one i want to wake up next to every day and go through everything together</p>
            <p><span className="ar" dir="rtl">روحي</span> <em>(roohi — my soul)</em> u are not just my love u are my home</p>
            <p>u are the person i feel myself with without pretending without hiding anything</p>
            <p>and that means everything to me</p>
            <p><span className="ar" dir="rtl">حبيبتي</span> <em>(habibti — my love)</em> i love the way u talk the way u smile the way u care the way u exist</p>
            <p>everything in u is beautiful in a way i cant explain</p>
            <p>and i fall in love with u more every single day without even trying</p>
            <p><span className="ar" dir="rtl">قلبي</span> <em>(albi — my heart)</em> i promise ill always try my best to make u happy</p>
            <p>to be there for u to support u to stand next to u in everything</p>
            <p>i want to be the reason u smile the same way u are the reason for mine 💕</p>
            <p>Marigona u are my present my future my everything</p>
            <p>i love u i adore u i need u in my life more than anything</p>
            <p><span className="ar" dir="rtl">حبيبتي</span> <em>(habibti — my love)</em> i just want u to know that no matter what happens ill always choose u</p>
            <p>every single time</p>
            <p className="signoff">always u and only u 💖</p>
          </article>

          <div className="game-cta">
            {!roomLink ? (
              <button className="btn yes" onClick={createRoom} disabled={creating}>
                {creating ? "Creating room... 💞" : "Create our love game room 🌹"}
              </button>
            ) : (
              <div className="room-card">
                <p className="room-title">Room ready 💖 Send me the link:</p>
                <div className="link-box">
                  <input readOnly value={roomLink} onFocus={(e) => e.target.select()} />
                  <button className="mini-btn" onClick={copyLink}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <div className="room-actions">
                  <button className="btn yes small" onClick={shareWhatsApp}>
                    Send on WhatsApp 💬
                  </button>
                  <button className="btn yes small" onClick={openRoom}>
                    Enter the room 🌹
                  </button>
                </div>
                <p className="room-hint">
                  Open this on your phone, send the link to your habibi, and play together in real time 💞
                </p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

const css = `
.romantic-root {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: linear-gradient(135deg, #ffe0ec 0%, #ffc1d9 50%, #ffd6e8 100%);
  font-family: 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif;
  color: #5a1140;
}

.floaters {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}
.floater {
  position: absolute;
  bottom: -40px;
  animation-name: floatUp;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.85;
  filter: drop-shadow(0 2px 4px rgba(255,105,180,0.4));
}
@keyframes floatUp {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
}

.stage {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 14px 60px;
  text-align: center;
  gap: 14px;
}

.glow-title {
  font-size: clamp(18px, 4vw, 36px);
  font-weight: 800;
  margin: 0 0 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-shadow:
    0 0 10px #fff,
    0 0 20px #ff7eb9,
    0 0 30px #ff65a3;
  animation: pulseGlow 2.4s ease-in-out infinite;
}
.glow-title .line { display: block; }
.glow-title .ar { font-family: 'Tahoma', sans-serif; font-size: 1.1em; }
.glow-title .tiny { font-size: 0.55em; opacity: 0.85; font-weight: 600; text-shadow: none; color: #8a1f5c; }
@keyframes pulseGlow {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px #ff7eb9); }
  50% { transform: scale(1.03); filter: drop-shadow(0 0 18px #ff3d8a); }
}

.scene {
  width: min(360px, 78vw);
  height: auto;
  margin: 4px 0 12px;
  filter: drop-shadow(0 10px 30px rgba(255,105,180,0.4));
  animation: bob 4s ease-in-out infinite;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.buttons {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
}
.btn {
  border: none;
  padding: 14px 28px;
  font-size: 20px;
  font-weight: 800;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
  touch-action: manipulation;
}
.btn.yes {
  background: linear-gradient(135deg, #ff4d8d, #ff85b3);
  color: white;
  animation: heartbeat 1.4s ease-in-out infinite;
}
.btn.yes:hover { transform: scale(1.06); box-shadow: 0 12px 28px rgba(255, 77, 141, 0.6); }
.btn.yes:disabled { opacity: 0.7; cursor: wait; animation: none; }
.btn.small { padding: 10px 18px; font-size: 16px; }
@keyframes heartbeat {
  0%,100% { transform: scale(1); }
  25% { transform: scale(1.06); }
  50% { transform: scale(1); }
  75% { transform: scale(1.04); }
}
.btn.no {
  background: linear-gradient(135deg, #ffd1dc, #ffe0ec);
  color: #c2185b;
  transition: left 0.25s ease, top 0.25s ease, transform 0.2s ease;
}

.popup {
  position: fixed;
  z-index: 50;
  background: white;
  color: #c2185b;
  padding: 10px 14px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  gap: 8px;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  animation: popIn 0.3s ease;
  max-width: 220px;
}
.popup-emoji { font-size: 22px; }
.popup-text { display: flex; flex-direction: column; line-height: 1.1; text-align: left; }
.popup-text small { font-size: 11px; opacity: 0.7; font-weight: 500; }
@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* YES stage */
.yes-stage { background: radial-gradient(circle at center, #fff0f6, #ffc1d9); }
.love-title {
  font-size: clamp(20px, 4.2vw, 40px);
  font-weight: 900;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0 18px;
}
.love-line {
  background: linear-gradient(90deg, #ff4d8d, #ff85b3, #ff4d8d);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 3s linear infinite, pulseGlow 2s ease-in-out infinite;
  text-shadow: 0 0 18px rgba(255,125,180,0.4);
}
.love-line.tiny { font-size: 0.5em; opacity: 0.9; }
@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.burst-layer {
  position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 3;
}
.burst {
  position: absolute;
  top: -40px;
  animation-name: fall;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
}
@keyframes fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}

.letter {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  border: 2px solid #ffb3cc;
  border-radius: 24px;
  padding: 22px 20px;
  max-width: 640px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(255, 105, 180, 0.25);
  text-align: left;
  font-size: clamp(15px, 2.4vw, 18px);
  line-height: 1.7;
  color: #4a0e35;
}
.letter p { margin: 0 0 10px; }
.letter .ar { font-family: 'Tahoma', sans-serif; font-weight: 700; color: #c2185b; }
.letter em { color: #8a1f5c; font-style: normal; font-size: 0.9em; }
.letter .signoff { margin-top: 14px; text-align: center; font-weight: 800; font-size: 1.15em; color: #c2185b; }

.game-cta { margin-top: 8px; width: 100%; max-width: 640px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.room-card {
  background: white;
  border-radius: 22px;
  padding: 18px;
  width: 100%;
  box-shadow: 0 12px 30px rgba(255, 105, 180, 0.3);
  border: 2px solid #ffb3cc;
}
.room-title { margin: 0 0 12px; font-weight: 800; color: #c2185b; }
.link-box { display: flex; gap: 8px; margin-bottom: 12px; }
.link-box input {
  flex: 1; min-width: 0;
  padding: 10px 12px; border-radius: 12px;
  border: 2px solid #ffd1dc; background: #fff5f9;
  font-family: inherit; font-size: 14px; color: #5a1140;
}
.mini-btn {
  border: none; padding: 10px 14px; border-radius: 12px;
  background: linear-gradient(135deg, #ff4d8d, #ff85b3);
  color: white; font-weight: 700; cursor: pointer;
  font-family: inherit;
}
.room-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.room-hint { margin: 12px 0 0; font-size: 13px; color: #8a1f5c; }

@media (max-width: 480px) {
  .btn { padding: 12px 22px; font-size: 17px; }
  .scene { width: min(280px, 75vw); }
  .letter { padding: 16px 14px; font-size: 14px; }
}
`;
