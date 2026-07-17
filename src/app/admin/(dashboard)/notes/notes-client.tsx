"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, BookOpen, Save, X } from "lucide-react";
import { Button, Card } from "@/components/admin/admin-ui";
import { DEPTS, DEPT_SLUGS } from "@/lib/admin/constants";

type Note = {
  id: string;
  dept: string;
  title: string;
  content: string;
  created_at: string;
};

type FormState = {
  dept: string;
  title: string;
  content: string;
};

const DEPT_OPTIONS = [
  ...DEPT_SLUGS.map((slug) => ({ value: slug, label: DEPTS[slug].nameEn })),
  { value: "others", label: "Others" },
];

// ─── Note Form Modal ──────────────────────────────────────────────────────────

function NoteFormModal({
  initial,
  defaultDept,
  onSave,
  onClose,
  saving,
}: {
  initial?: Note;
  defaultDept: string;
  onSave: (form: FormState) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>({
    dept: initial?.dept ?? defaultDept,
    title: initial?.title ?? "",
    content: initial?.content ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setError(null);
    await onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#003580]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#003580]" />
            </div>
            <h2 className="text-base font-bold text-[#1A202C]">
              {initial ? "Edit Note" : "New Note"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-[#1A202C] uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={form.dept}
              onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 transition bg-white"
              disabled={!!initial}
            >
              {DEPT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#1A202C] uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Key Formulas for Mathematics"
              className="w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 transition"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-[#1A202C] uppercase tracking-wider mb-1.5">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write the note content here…"
              rows={8}
              className="w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-xl text-sm text-[#1A202C] focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 transition resize-vertical font-mono leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" />
              {initial ? "Save Changes" : "Create Note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function AdminNotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filterDept === "all"
          ? "/api/notes?dept=all"
          : `/api/notes?dept=${encodeURIComponent(filterDept)}`;

      // For "all", we need to fetch per dept and merge
      if (filterDept === "all") {
        const allDepts = [...DEPT_SLUGS, "others"];
        const results = await Promise.all(
          allDepts.map((d) =>
            fetch(`/api/notes?dept=${d}`).then((r) => r.json())
          )
        );
        const merged: Note[] = results.flatMap((r) => (r.ok ? (r.notes as Note[]) : []));
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotes(merged);
      } else {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "Failed to load notes.");
        setNotes(data.notes ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [filterDept]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  async function handleSave(form: FormState) {
    setSaving(true);
    try {
      if (editNote) {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: editNote.id, title: form.title, content: form.content }),
        });
        if (!res.ok) throw new Error("Failed to update note.");
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create note.");
      }
      setModalOpen(false);
      setEditNote(undefined);
      await fetchNotes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note.");
      await fetchNotes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  const deptLabelMap: Record<string, string> = Object.fromEntries(
    DEPT_OPTIONS.map((d) => [d.value, d.label])
  );

  return (
    <>
      {(modalOpen || editNote) && (
        <NoteFormModal
          initial={editNote}
          defaultDept={filterDept === "all" ? "amt" : filterDept}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditNote(undefined); }}
          saving={saving}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">Notes</h1>
            <p className="text-sm text-[#64748B] mt-1">Manage study notes shown to students per department</p>
          </div>
          <Button onClick={() => { setEditNote(undefined); setModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Filter:</span>
          {[{ value: "all", label: "All" }, ...DEPT_OPTIONS].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterDept(opt.value)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                filterDept === opt.value
                  ? "bg-[#003580] text-white border-[#003580] shadow-sm"
                  : "bg-white text-[#64748B] border-[#E4E8F0] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-16 text-[#64748B] text-sm">Loading…</div>
        ) : notes.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-[#CBD5E1]" />
              <p className="text-sm font-semibold text-[#1A202C] mb-1">No notes yet</p>
              <p className="text-sm text-[#64748B]">Click &ldquo;New Note&rdquo; to add the first one.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="p-0 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#003580]/8 text-[#003580] text-xs font-bold uppercase tracking-wide">
                          {deptLabelMap[note.dept] ?? note.dept}
                        </span>
                        <span className="text-xs text-[#94A3B8]">
                          {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1A202C] truncate">{note.title}</h3>
                      <p className="text-sm text-[#64748B] mt-1 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditNote(note); setModalOpen(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#003580] transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
