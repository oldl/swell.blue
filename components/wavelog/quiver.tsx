"use client";

import { useMemo, useState } from "react";

import { BOARD_TYPES, boardTypeInfo, guessBoardType, type BoardType } from "@/lib/board-types";
import { createClient } from "@/lib/supabase/client";
import { BOARD_STATUSES, type BoardRecord, type BoardStatus, type SessionRecord } from "@/lib/types";

import { BoardShape } from "./board-shape";
import { Icon } from "./ui";

type Props = {
  userId: string;
  sessions: SessionRecord[]; // whole logbook
  periodSessions: SessionRecord[]; // sessions of the selected stats period
  boards: BoardRecord[];
  onSaved: (boards: BoardRecord[], renames: Record<string, string>) => void;
  toast: (message: string) => void;
};

type BoardStat = { name: string; count: number; ratingTotal: number; ratingCount: number };

type BoardDraft = {
  key: string;
  original: string | null; // null for a board added in this edit
  sessions: number;
  name: string;
  model: string;
  volume: string;
  dimensions: string;
  status: BoardStatus;
  type: BoardType | "";
  bestConditions: string;
};

/** Every known board — logged in a session or only saved in the quiver — with its stats over `list`. */
function quiverStats(list: SessionRecord[], boards: BoardRecord[]) {
  const stats = new Map<string, BoardStat>();
  boards.forEach((b) => stats.set(b.name, { name: b.name, count: 0, ratingTotal: 0, ratingCount: 0 }));
  list.forEach((s) => {
    if (!s.board) return;
    const stat = stats.get(s.board) ?? { name: s.board, count: 0, ratingTotal: 0, ratingCount: 0 };
    stat.count++;
    if (s.rating) {
      stat.ratingTotal += s.rating;
      stat.ratingCount++;
    }
    stats.set(s.board, stat);
  });
  return Array.from(stats.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function defaultStatus(index: number, count: number): BoardStatus {
  return index === 0 && count > 0 ? "Daily driver" : "In rotation";
}

export function Quiver({ userId, sessions, periodSessions, boards, onSaved, toast }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const profiles = useMemo(() => new Map(boards.map((b) => [b.name, b])), [boards]);
  const [drafts, setDrafts] = useState<BoardDraft[] | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const editMode = drafts !== null;

  function startEdit() {
    setRemoved([]);
    setDrafts(
      quiverStats(sessions, boards).map((stat, index) => {
        const p = profiles.get(stat.name);
        return {
          key: stat.name,
          original: stat.name,
          sessions: stat.count,
          name: stat.name,
          model: p?.model ?? "",
          volume: p?.volume_l != null ? String(p.volume_l) : "",
          dimensions: p?.dimensions ?? "",
          status: p?.status ?? defaultStatus(index, stat.count),
          type: p?.board_type ?? guessBoardType(stat.name) ?? "",
          bestConditions: p?.best_conditions ?? ""
        };
      })
    );
  }

  function addBoard() {
    const key = `new-${newCount}`;
    setNewCount((n) => n + 1);
    setDrafts((current) => [
      ...(current ?? []),
      { key, original: null, sessions: 0, name: "", model: "", volume: "", dimensions: "", status: "In rotation", type: "", bestConditions: "" }
    ]);
  }

  function removeDraft(draft: BoardDraft) {
    setDrafts((current) => current?.filter((d) => d.key !== draft.key) ?? null);
    if (draft.original && profiles.has(draft.original)) setRemoved((r) => [...r, draft.original!]);
  }

  function updateDraft(key: string, field: keyof BoardDraft, value: string) {
    setDrafts((current) => current?.map((d) => (d.key === key ? { ...d, [field]: value } : d)) ?? null);
  }

  async function save() {
    if (!drafts || saving) return;
    if (drafts.some((d) => !d.name.trim())) {
      toast("Board name cannot be empty");
      return;
    }
    if (drafts.some((d) => d.volume.trim() && !(Number(d.volume) > 0))) {
      toast("Volume must be a positive number");
      return;
    }

    setSaving(true);
    const renames: Record<string, string> = {};
    try {
      if (removed.length) {
        const { error } = await supabase.from("boards").delete().in("name", removed);
        if (error) throw error;
      }
      for (const d of drafts) {
        const name = d.name.trim();
        if (d.original && name !== d.original) {
          const { error } = await supabase.rpc("rename_board", { old_name: d.original, new_name: name });
          if (error) throw error;
          renames[d.original] = name;
        }
      }
      const rows = drafts.map((d) => ({
        user_id: userId,
        name: d.name.trim(),
        model: d.model.trim() || null,
        volume_l: d.volume.trim() ? Number(d.volume) : null,
        dimensions: d.dimensions.trim() || null,
        status: d.status,
        board_type: d.type || null,
        best_conditions: d.bestConditions.trim() || null
      }));
      // Two boards renamed to the same name merge: keep one row per name.
      const unique = Array.from(new Map(rows.map((row) => [row.name, row])).values());
      if (unique.length) {
        const { error } = await supabase.from("boards").upsert(unique, { onConflict: "user_id,name" });
        if (error) throw error;
      }
      const { data: fresh, error: readError } = await supabase.from("boards").select("*").order("name");
      if (readError) throw readError;

      onSaved((fresh as BoardRecord[]) ?? [], renames);
      setDrafts(null);
      const renamed = Object.keys(renames).length;
      toast(renamed ? `Quiver saved · ${renamed} board${renamed === 1 ? "" : "s"} renamed` : "Quiver saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
      toast(`Quiver not saved: ${message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  const viewBoards = quiverStats(periodSessions, boards);

  return (
    <section className="stats-sweet-wrap">
      <div className="stats-sweet-head">
        <div>
          <h2 className="stats-section-title">Your Quiver</h2>
          <p className="stats-section-copy">
            {editMode
              ? "Add boards, rename them and fill in their specs. Renaming updates every session that used the board."
              : "Equipment usage and rating across your sessions."}
          </p>
        </div>
        <div className="stats-quiver-actions">
          {editMode ? (
            <>
              <button className="stats-quiver-edit-btn" type="button" disabled={saving} onClick={addBoard}>
                + Add board
              </button>
              <button className="stats-quiver-edit-btn" type="button" disabled={saving} onClick={() => setDrafts(null)}>
                Cancel
              </button>
              <button className="stats-quiver-edit-btn primary" type="button" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save quiver"}
              </button>
            </>
          ) : (
            <>
              <div className="pill pill-outline">
                {viewBoards.length} board{viewBoards.length === 1 ? "" : "s"}
              </div>
              <button className="stats-quiver-edit-btn" type="button" onClick={startEdit}>
                Edit quiver
              </button>
            </>
          )}
        </div>
      </div>

      {editMode ? (
        drafts.length ? (
          <div className="stats-quiver">
            {drafts.map((draft, index) => (
              <div key={draft.key} className={index === 0 && draft.sessions > 0 ? "stats-board top" : "stats-board"}>
                <div className="stats-board-edit-head">
                  <div className="stats-eyebrow">
                    {draft.original ? `${draft.sessions} session${draft.sessions === 1 ? "" : "s"}` : "New board"}
                  </div>
                  {draft.sessions === 0 ? (
                    <button className="stats-board-remove" type="button" onClick={() => removeDraft(draft)} aria-label={`Remove ${draft.name || "new board"}`}>
                      <Icon name="delete" />
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="stats-board-edit">
                  <label>
                    Name
                    <input
                      type="text"
                      value={draft.name}
                      placeholder={'6\'2" thruster'}
                      autoComplete="off"
                      autoFocus={!draft.original}
                      onChange={(e) => updateDraft(draft.key, "name", e.target.value)}
                    />
                  </label>
                  <div className="board-type-field">
                    <span>Type</span>
                    <div className="board-type-picker" role="radiogroup" aria-label="Board type">
                      {BOARD_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={draft.type === t.id}
                          className={draft.type === t.id ? "board-type-option active" : "board-type-option"}
                          onClick={() => updateDraft(draft.key, "type", draft.type === t.id ? "" : t.id)}
                        >
                          <BoardShape type={t.id} height={54} />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    Model / shaper
                    <input type="text" value={draft.model} placeholder="Pyzel Ghost" autoComplete="off" onChange={(e) => updateDraft(draft.key, "model", e.target.value)} />
                  </label>
                  <div className="stats-board-edit-row">
                    <label>
                      Volume (L)
                      <input
                        type="number"
                        value={draft.volume}
                        placeholder="31.5"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        onChange={(e) => updateDraft(draft.key, "volume", e.target.value)}
                      />
                    </label>
                    <label>
                      Dimensions
                      <input type="text" value={draft.dimensions} placeholder="19¼ × 2½" autoComplete="off" onChange={(e) => updateDraft(draft.key, "dimensions", e.target.value)} />
                    </label>
                  </div>
                  <label>
                    Status
                    <select value={draft.status} onChange={(e) => updateDraft(draft.key, "status", e.target.value)}>
                      {BOARD_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Best conditions
                    <input
                      type="text"
                      value={draft.bestConditions}
                      placeholder="Offshore, hollow, 1-1.5 m"
                      autoComplete="off"
                      onChange={(e) => updateDraft(draft.key, "bestConditions", e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="stats-quiver-empty">No boards yet. Use “+ Add board” to start your quiver.</p>
        )
      ) : viewBoards.length ? (
        <div className="stats-quiver">
          {viewBoards.map((board, index) => {
            const profile = profiles.get(board.name);
            const avg = board.ratingCount ? board.ratingTotal / board.ratingCount : null;
            const specs = [profile?.model, profile?.volume_l != null ? `${profile.volume_l}L` : null, profile?.dimensions].filter(Boolean).join(" · ");
            const mostUsed = index === 0 && board.count > 0;
            const type = boardTypeInfo(profile?.board_type);
            return (
              <div key={board.name} className={mostUsed ? "stats-board top" : "stats-board"}>
                <div className="stats-board-head">
                  <div>
                    <div className="stats-eyebrow">
                      {mostUsed ? "Most Used" : "Surf Craft"}
                      {type ? ` · ${type.label}` : ""}
                    </div>
                    <div className="stats-board-name">{board.name}</div>
                    {specs ? <div className="stats-spot-meta">{specs}</div> : null}
                  </div>
                  <BoardShape type={profile?.board_type} height={104} className="stats-board-shape" />
                </div>
                <div className="stats-board-grid">
                  <div>
                    <span>Sessions</span>
                    <strong>{board.count} logged</strong>
                  </div>
                  <div>
                    <span>Avg Rating</span>
                    <strong>{avg === null ? "—" : `${avg.toFixed(1)} ★`}</strong>
                  </div>
                  <div>
                    <span>Usage</span>
                    <strong>{periodSessions.length ? Math.round((board.count / periodSessions.length) * 100) : 0}%</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{profile?.status ?? defaultStatus(index, board.count)}</strong>
                  </div>
                </div>
                {profile?.best_conditions ? <div className="stats-board-preference">Best in: {profile.best_conditions}</div> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="stats-quiver-empty">No boards yet. Use “Edit quiver” to add your first board.</p>
      )}
    </section>
  );
}
