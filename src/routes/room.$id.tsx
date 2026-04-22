import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/room/$id")({
  component: RoomPage,
  head: () => ({
    meta: [
      { title: "Bahbek ya Marigona — our love game 💞" },
      { name: "description", content: "Bahbek ya Marigona — Hearts vs Roses, our private love game 🌹" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
});

type Cell = "" | "❤️" | "🌹";
type Room = {
  id: string;
  board: Cell[];
  turn: "❤️" | "🌹";
  winner: string | null;
};

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function pickRole(): "❤️" | "🌹" {
  if (typeof window === "undefined") return "❤️";
  const key = "love-game-role";
  const existing = window.localStorage.getItem(key);
  if (existing === "❤️" || existing === "🌹") return existing;
  return "❤️";
}

function RoomPage() {
  const { id } = Route.useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"❤️" | "🌹">(pickRole);
  const [copied, setCopied] = useState(false);

  const link = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/room/${id}` : ""),
    [id],
  );

  // Load + subscribe to realtime updates
  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error: err } = await supabase
        .from("game_rooms")
        .select("id, board, turn, winner")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (err || !data) {
        setError("Room not found 💔");
        return;
      }
      setRoom(data as unknown as Room);
    }
    load();

    const channel = supabase
      .channel(`room-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) setRoom(payload.new as unknown as Room);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  function setRolePersist(r: "❤️" | "🌹") {
    setRole(r);
    try {
      window.localStorage.setItem("love-game-role", r);
    } catch {
      /* ignore */
    }
  }

  async function play(i: number) {
    if (!room || room.winner) return;
    if (room.board[i]) return;
    if (room.turn !== role) return; // not your turn

    const next = [...room.board];
    next[i] = role;

    let winner: string | null = null;
    for (const [a, b, c] of LINES) {
      if (next[a] && next[a] === next[b] && next[a] === next[c]) {
        winner = next[a];
        break;
      }
    }
    if (!winner && next.every((c) => c)) winner = "draw";

    const nextTurn = role === "❤️" ? "🌹" : "❤️";

    // Optimistic
    setRoom({ ...room, board: next, turn: nextTurn, winner });

    const { error: err } = await supabase
      .from("game_rooms")
      .update({ board: next, turn: nextTurn, winner, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) console.error(err);
  }

  async function reset() {
    const empty: Cell[] = ["", "", "", "", "", "", "", "", ""];
    setRoom((prev) => (prev ? { ...prev, board: empty, turn: "❤️", winner: null } : prev));
    await supabase
      .from("game_rooms")
      .update({ board: empty, turn: "❤️", winner: null, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function shareWhatsApp() {
    const text = `Habibi 💖 join our love game: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="room-root">
      <style>{css}</style>

      <header className="room-header">
        <Link to="/" className="back">← back</Link>
        <h1>Hearts ❤️ vs Roses 🌹</h1>
      </header>

      {error && (
        <div className="card center">
          <p>{error}</p>
          <Link to="/" className="mini-btn">Go home 💖</Link>
        </div>
      )}

      {!error && !room && <p className="loading">Loading our love game... 💞</p>}

      {!error && room && (
        <main className="room-main">
          <section className="card">
            <h2 className="muted">Choose your side:</h2>
            <div className="role-row">
              <button
                className={`role ${role === "❤️" ? "active" : ""}`}
                onClick={() => setRolePersist("❤️")}
              >
                ❤️ Hearts
              </button>
              <button
                className={`role ${role === "🌹" ? "active" : ""}`}
                onClick={() => setRolePersist("🌹")}
              >
                🌹 Roses
              </button>
            </div>
            <p className="hint">
              You are <strong>{role}</strong>. Send the link below so the other player picks the other side 💞
            </p>
          </section>

          <section className="card">
            <p className="status">
              {room.winner
                ? room.winner === "draw"
                  ? "It's a tie — still in love 💕"
                  : `${room.winner} wins! 💖`
                : room.turn === role
                  ? `Your turn (${role}) 💘`
                  : `Waiting for ${room.turn}...`}
            </p>
            <div className="grid">
              {room.board.map((c, i) => {
                const disabled = !!c || !!room.winner || room.turn !== role;
                return (
                  <button
                    key={i}
                    className="cell"
                    disabled={disabled}
                    onClick={() => play(i)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {room.winner && (
              <div className="win">
                {room.winner === "draw"
                  ? "Our love wins anyway 🌷"
                  : room.winner === "❤️"
                    ? "Hearts win — we belong together forever 💘"
                    : "Roses win — a bouquet just for you 🌹"}
              </div>
            )}
            <button className="primary" onClick={reset}>Play again 💞</button>
          </section>

          <section className="card">
            <h2 className="muted">Share this room link:</h2>
            <div className="link-box">
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
              <button className="mini-btn" onClick={copy}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <button className="primary outline" onClick={shareWhatsApp}>
              Send on WhatsApp 💬
            </button>
          </section>
        </main>
      )}
    </div>
  );
}

const css = `
.room-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffe0ec 0%, #ffc1d9 50%, #ffd6e8 100%);
  color: #5a1140;
  font-family: 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif;
  padding: 16px 14px 60px;
}
.room-header {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 560px; margin: 0 auto 12px; gap: 10px;
}
.room-header h1 {
  font-size: clamp(18px, 4vw, 26px); margin: 0; font-weight: 900;
  text-shadow: 0 0 10px #ff7eb9;
}
.back {
  text-decoration: none; color: #c2185b; font-weight: 800;
  background: white; padding: 6px 12px; border-radius: 999px;
  box-shadow: 0 4px 12px rgba(255,105,180,0.3);
}
.loading { text-align: center; font-weight: 700; padding: 40px 10px; }

.room-main { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.card {
  background: white; border-radius: 22px; padding: 18px;
  border: 2px solid #ffb3cc;
  box-shadow: 0 8px 22px rgba(255,105,180,0.2);
}
.card.center { text-align: center; max-width: 420px; margin: 40px auto; }
.muted { margin: 0 0 10px; font-size: 16px; color: #8a1f5c; font-weight: 700; }
.hint { margin: 10px 0 0; font-size: 13px; color: #8a1f5c; }

.role-row { display: flex; gap: 10px; }
.role {
  flex: 1; padding: 12px; border-radius: 14px; border: 2px solid #ffd1dc;
  background: #fff5f9; font-family: inherit; font-size: 16px; font-weight: 700;
  cursor: pointer; color: #5a1140; transition: all 0.2s ease;
}
.role.active {
  background: linear-gradient(135deg, #ff4d8d, #ff85b3); color: white; border-color: transparent;
  transform: scale(1.03); box-shadow: 0 6px 16px rgba(255,77,141,0.4);
}

.status { text-align: center; font-weight: 800; font-size: 18px; margin: 0 0 12px; color: #c2185b; }
.grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  max-width: 320px; margin: 0 auto 14px;
}
.cell {
  aspect-ratio: 1; border-radius: 16px; border: none; background: #fff5f9;
  font-size: clamp(32px, 9vw, 44px); cursor: pointer;
  box-shadow: inset 0 0 0 2px #ffd1dc;
  transition: transform 0.15s ease;
  font-family: inherit;
  touch-action: manipulation;
}
.cell:not(:disabled):hover { transform: scale(1.05); background: #ffe9f1; }
.cell:disabled { cursor: not-allowed; }
.win {
  text-align: center; font-weight: 800; font-size: 17px; color: #c2185b;
  margin: 6px 0 14px;
}
.primary {
  display: block; width: 100%;
  border: none; padding: 14px; border-radius: 16px;
  background: linear-gradient(135deg, #ff4d8d, #ff85b3);
  color: white; font-weight: 800; font-size: 17px; cursor: pointer;
  font-family: inherit; box-shadow: 0 6px 18px rgba(255,77,141,0.4);
  touch-action: manipulation;
}
.primary.outline {
  background: white; color: #c2185b; border: 2px solid #ff85b3;
  margin-top: 10px;
}

.link-box { display: flex; gap: 8px; margin-bottom: 10px; }
.link-box input {
  flex: 1; min-width: 0; padding: 10px 12px; border-radius: 12px;
  border: 2px solid #ffd1dc; background: #fff5f9;
  font-family: inherit; font-size: 13px; color: #5a1140;
}
.mini-btn {
  border: none; padding: 10px 14px; border-radius: 12px;
  background: linear-gradient(135deg, #ff4d8d, #ff85b3);
  color: white; font-weight: 700; cursor: pointer;
  font-family: inherit; text-decoration: none; display: inline-block;
}
`;
