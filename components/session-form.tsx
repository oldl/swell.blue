"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
};

type FormState = {
  spot: string;
  date: string;
  time: string;
  hours: string;
  waveSize: string;
  tide: string;
  swellDirection: string;
  windType: string;
  waterTemp: string;
  waveShape: string;
  current: string;
  crowd: string;
  suit: string;
  sessionType: string;
  withWho: string;
  board: string;
  rating: string;
  comments: string;
};

const HOURS_OPTIONS = ["0.5h", "1h", "1.5h", "2h", "2.5h", "3h", "3h+"];
const WAVE_SIZE_OPTIONS = ["XS", "S", "S-M", "M", "M-L", "L", "XL", "XXL"];
const TIDE_OPTIONS = ["Low", "Mid", "High", "Dropping", "Rising"];
const DIRECTION_OPTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const WIND_OPTIONS = ["Glassy", "Offshore", "Cross-off", "Cross-on", "Onshore"];
const SHAPE_OPTIONS = ["Hollow", "Punchy", "Mushy", "Fat", "Crumbly"];
const CURRENT_OPTIONS = ["None", "Light", "Strong"];
const CROWD_OPTIONS = ["Empty", "Quiet", "Busy", "Packed"];
const SUIT_OPTIONS = ["Trunks", "Spring", "3/2", "4/3", "5/4"];
const SESSION_TYPE_OPTIONS = ["Solo", "With others"];

function todayIso() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="fsec-title-ui">{children}</div>;
}

function ChipPicker({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chip-row">
        {options.map((option) => (
          <button
            key={option}
            className={option === value ? "chip-button chip-button-active" : "chip-button"}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RatingPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>Note</label>
      <div className="rating-picker">
        {Array.from({ length: 10 }, (_, index) => {
          const option = String(index + 1);
          return (
            <button
              key={option}
              className={option === value ? "rating-button rating-button-active" : "rating-button"}
              type="button"
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SessionForm({ userId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    spot: "",
    date: todayIso(),
    time: "",
    hours: "1h",
    waveSize: "",
    tide: "",
    swellDirection: "",
    windType: "",
    waterTemp: "",
    waveShape: "",
    current: "",
    crowd: "",
    suit: "Spring",
    sessionType: "Solo",
    withWho: "",
    board: "",
    rating: "",
    comments: ""
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function resetForm() {
    setForm({
      spot: "",
      date: todayIso(),
      time: "",
      hours: "1h",
      waveSize: "",
      tide: "",
      swellDirection: "",
      windType: "",
      waterTemp: "",
      waveShape: "",
      current: "",
      crowd: "",
      suit: "Spring",
      sessionType: "Solo",
      withWho: "",
      board: "",
      rating: "",
      comments: ""
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.spot.trim()) {
      setError("Le spot est obligatoire.");
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);

    const payload = {
      user_id: userId,
      spot: form.spot.trim(),
      date: form.date || todayIso(),
      time: form.time || null,
      hours: form.hours || null,
      wave_size: form.waveSize || null,
      tide: form.tide || null,
      swell_direction: form.swellDirection || null,
      wind_type: form.windType || null,
      water_temp: form.waterTemp ? Number(form.waterTemp) : null,
      wave_shape: form.waveShape || null,
      current: form.current || null,
      crowd: form.crowd || null,
      suit: form.suit || null,
      session_type: form.sessionType || null,
      with_who: form.sessionType === "With others" ? form.withWho.trim() || null : null,
      board: form.board.trim() || null,
      rating: form.rating ? Number(form.rating) : null,
      comments: form.comments.trim() || null
    };

    const { error: insertError } = await supabase.from("sessions").insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("Session enregistree.");
    resetForm();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="panel logbook-form">
      <div className="form-hero">
        <div>
          <div className="eyebrow">Nouvelle session</div>
          <h2 style={{ margin: "10px 0 8px", fontSize: "36px", lineHeight: 1.02 }}>
            Ecrire une entree de carnet
          </h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            On recolle maintenant beaucoup plus au layout du prototype original.
          </p>
        </div>
        <div className="form-hero-badge">
          <div className="form-hero-badge-label">Mode</div>
          <div className="form-hero-badge-value">Wave Log</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="log-layout">
          <div className="log-main-area-ui">
            <section className="form-section-ui">
              <SectionTitle>📍 Where &amp; When</SectionTitle>
              <div className="field">
                <label htmlFor="spot">Spot</label>
                <input
                  id="spot"
                  value={form.spot}
                  onChange={(event) => update("spot", event.target.value)}
                  placeholder="La Graviere, Hossegor"
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="field">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(event) => update("date", event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="time">Heure</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(event) => update("time", event.target.value)}
                  />
                </div>
              </div>

              <ChipPicker label="Duree" options={HOURS_OPTIONS} value={form.hours} onChange={(value) => update("hours", value)} />
            </section>

            <section className="form-section-ui">
              <SectionTitle>🌊 Waves</SectionTitle>
              <ChipPicker label="Wave Size" options={WAVE_SIZE_OPTIONS} value={form.waveSize} onChange={(value) => update("waveSize", value)} />
              <ChipPicker label="Wave Shape" options={SHAPE_OPTIONS} value={form.waveShape} onChange={(value) => update("waveShape", value)} />
              <ChipPicker label="Tide" options={TIDE_OPTIONS} value={form.tide} onChange={(value) => update("tide", value)} />
              <ChipPicker
                label="Swell Direction"
                options={DIRECTION_OPTIONS}
                value={form.swellDirection}
                onChange={(value) => update("swellDirection", value)}
              />
            </section>

            <section className="form-section-ui">
              <SectionTitle>🌬 Elements</SectionTitle>
              <ChipPicker label="Wind" options={WIND_OPTIONS} value={form.windType} onChange={(value) => update("windType", value)} />
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label htmlFor="waterTemp">Water Temp (°C)</label>
                  <input
                    id="waterTemp"
                    type="number"
                    min="0"
                    max="40"
                    value={form.waterTemp}
                    onChange={(event) => update("waterTemp", event.target.value)}
                    placeholder="18"
                  />
                </div>
                <ChipPicker label="Current" options={CURRENT_OPTIONS} value={form.current} onChange={(value) => update("current", value)} />
              </div>
              <ChipPicker label="Crowd" options={CROWD_OPTIONS} value={form.crowd} onChange={(value) => update("crowd", value)} />
            </section>
          </div>

          <aside className="log-aside-ui">
            <div className="log-aside-inner-ui">
              <section className="form-section-ui">
                <SectionTitle>🏄 Setup</SectionTitle>
                <div className="field">
                  <label htmlFor="board">Board</label>
                  <input
                    id="board"
                    value={form.board}
                    onChange={(event) => update("board", event.target.value)}
                    placeholder="6'2 thruster..."
                  />
                </div>
                <ChipPicker label="Wetsuit" options={SUIT_OPTIONS} value={form.suit} onChange={(value) => update("suit", value)} />
                <ChipPicker
                  label="Session"
                  options={SESSION_TYPE_OPTIONS}
                  value={form.sessionType}
                  onChange={(value) => update("sessionType", value)}
                />
                {form.sessionType === "With others" ? (
                  <div className="field">
                    <label htmlFor="withWho">Who with?</label>
                    <input
                      id="withWho"
                      value={form.withWho}
                      onChange={(event) => update("withWho", event.target.value)}
                      placeholder="Friends, crew..."
                    />
                  </div>
                ) : null}
              </section>

              <section className="form-section-ui">
                <SectionTitle>⭐ Reflection</SectionTitle>
                <RatingPicker value={form.rating} onChange={(value) => update("rating", value)} />
                <div className="field">
                  <label htmlFor="comments">Notes</label>
                  <textarea
                    id="comments"
                    value={form.comments}
                    onChange={(event) => update("comments", event.target.value)}
                    placeholder="How was it? Any memorable waves..."
                    style={{ minHeight: 140, padding: 14 }}
                  />
                </div>
              </section>
            </div>

            <div className="log-aside-save-ui">
              {error ? <div className="error">{error}</div> : null}
              {message ? <div className="pill" style={{ width: "fit-content" }}>{message}</div> : null}
              <button className="button form-save-button" type="submit" disabled={pending}>
                {pending ? "Enregistrement..." : "Save Session"}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </section>
  );
}
