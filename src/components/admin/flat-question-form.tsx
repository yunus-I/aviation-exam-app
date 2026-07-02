"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEPTS, type DeptSlug } from "@/lib/admin/constants";

interface ImageItem {
  id: string;
  public_url: string;
}

interface FlatFormData {
  question_num: number;
  topicSlug: string;
  type: string;
  prompt: string;
  explanation: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correct: string;
  duration_minutes: number;
}

interface Topic { id: string; slug: string; name_en: string; }
interface Props {
  dept: DeptSlug;
  topics: Topic[];
  initialData?: FlatFormData & { id: string; images: ImageItem[] };
}

const defaultForm: FlatFormData = {
  question_num: 0,
  topicSlug: "",
  type: "single_choice",
  prompt: "",
  explanation: "",
  optA: "",
  optB: "",
  optC: "",
  optD: "",
  correct: "",
  duration_minutes: 2,
};

export function FlatQuestionForm({ dept, topics, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const deptInfo = DEPTS[dept];

  const [form, setForm] = useState<FlatFormData>(initialData ?? defaultForm);
  const [images, setImages] = useState<ImageItem[]>(initialData?.images ?? []);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const createdId = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && initialData) {
      fetch(`/api/admin/questions/${initialData.id}/images`)
        .then((r) => r.json())
        .then((d) => { if (d.ok) setImages(d.images); })
        .catch(() => {});
    }
  }, [isEdit, initialData]);

  function upd<K extends keyof FlatFormData>(k: K, v: FlatFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!form.prompt.trim()) { setError("Prompt is required."); setSaving(false); return; }
    if (!form.topicSlug) { setError("Topic is required."); setSaving(false); return; }

    if (!form.optA.trim()) { setError("Option A is required."); setSaving(false); return; }
    if (!form.optB.trim()) { setError("Option B is required."); setSaving(false); return; }

    if (!form.correct) { setError("Select the correct answer."); setSaving(false); return; }

    const options = [
      { option_key: "A", option_text_en: form.optA, is_correct: form.correct === "A" },
      { option_key: "B", option_text_en: form.optB, is_correct: form.correct === "B" },
      { option_key: "C", option_text_en: form.optC || "—", is_correct: form.correct === "C" },
      { option_key: "D", option_text_en: form.optD || "—", is_correct: form.correct === "D" },
    ].filter((o) => o.option_text_en !== "—");

    const body = {
      ...form,
      department_id: deptInfo.dbDeptId,
      options,
    };

    const url = isEdit ? `/api/admin/questions/${initialData.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed."); setSaving(false); return; }

      setSuccess(isEdit ? "Question updated." : "Question created.");
      setSaving(false);

      if (!isEdit && data.id) {
        createdId.current = data.id;
        if (pendingFile) {
          await handleUpload(pendingFile);
          setPendingFile(null);
        }
        setTimeout(() => router.push(`/admin/${dept}/${data.id}/edit`), 600);
      }
    } catch { setError("Network error."); setSaving(false); }
  }

  async function handleDelete() {
    if (!initialData || !confirm("Delete this question permanently?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${initialData.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed."); setSaving(false); return; }
      router.push(`/admin/${dept}`);
    } catch { setError("Network error."); setSaving(false); }
  }

  async function handleUpload(file: File) {
    const qid = initialData?.id ?? createdId.current;
    if (!qid) { setPendingFile(file); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("question_id", qid);
    try {
      const res = await fetch("/api/admin/questions/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Upload failed."); setUploading(false); return; }
      const r2 = await fetch(`/api/admin/questions/${qid}/images`);
      const d2 = await r2.json();
      if (d2.ok) setImages(d2.images);
    } catch { setError("Upload failed."); }
    setUploading(false);
  }

  function handleFileSelected(file: File) {
    if (isEdit || createdId.current) {
      handleUpload(file);
    } else {
      setPendingFile(file);
    }
  }

  async function handleDeleteImage(imgId: string) {
    if (!initialData) return;
    const res = await fetch(`/api/admin/questions/${initialData.id}/images?mediaId=${imgId}`, { method: "DELETE" });
    if (res.ok) setImages((p) => p.filter((i) => i.id !== imgId));
    else { const d = await res.json(); setError(d.error || "Delete failed."); }
  }

  const input = "w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-lg text-sm focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition bg-white";
  const label = "text-xs font-semibold text-[#1A202C]";
  const sel = input;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {/* ---- Basic info ---- */}
      <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-[#003580] tracking-wider uppercase flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Question Info
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Question #</label>
            <input type="number" value={form.question_num} onChange={(e) => upd("question_num", parseInt(e.target.value) || 0)} className={input} min={1} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Topic *</label>
            <select value={form.topicSlug} onChange={(e) => upd("topicSlug", e.target.value)} className={sel} required>
              <option value="">Select topic…</option>
              {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Type</label>
            <select value={form.type} onChange={(e) => upd("type", e.target.value)} className={sel}>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Prompt *</label>
          <textarea value={form.prompt} onChange={(e) => upd("prompt", e.target.value)} rows={3} className={input + " resize-y"} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Explanation</label>
          <textarea value={form.explanation} onChange={(e) => upd("explanation", e.target.value)} rows={2} className={input + " resize-y"} />
        </div>
      </div>

      {/* ---- Options ---- */}
      <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold text-[#003580] tracking-wider uppercase flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Answer Options
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {(["A", "B", "C", "D"] as const).map((key) => (
            <div key={key} className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="radio"
                  name="correct"
                  checked={form.correct === key}
                  onChange={() => upd("correct", key)}
                  className="w-4 h-4 accent-[#003580]"
                />
                <span className="text-xs font-bold text-[#64748B] w-4">{key}</span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className={label}>Option {key}</label>
                <input type="text" value={form[`opt${key}` as keyof FlatFormData] as string} onChange={(e) => upd(`opt${key}` as keyof FlatFormData, e.target.value) as any} placeholder={`Option ${key} text…`} className={input} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94A3B8]">Select the radio button next to the correct answer.</p>
      </div>

      {/* ---- Extra ---- */}
      <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold text-[#003580] tracking-wider uppercase flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Timing & Image
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Duration (minutes)</label>
            <input type="number" value={form.duration_minutes} onChange={(e) => upd("duration_minutes", parseInt(e.target.value) || 1)} className={input} min={1} max={60} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#1A202C]">Question Image</span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs font-semibold text-[#003580] hover:text-[#00276B] disabled:opacity-50 transition">
              {uploading ? "Uploading…" : pendingFile ? "File selected" : images.length > 0 ? "Change Image" : "Upload Image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ""; }} />
          </div>

          {pendingFile && !isEdit && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Image will be uploaded after the question is created.
            </div>
          )}

          {!pendingFile && images.length === 0 && (
            <p className="text-xs text-[#94A3B8]">No image uploaded.</p>
          )}

          {images.length > 0 && (
            <div className="relative group inline-block rounded-lg overflow-hidden border border-[#E4E8F0]">
              <img src={images[0].public_url} alt="" className="max-h-48 object-contain" />
              <button type="button" onClick={() => handleDeleteImage(images[0].id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md">×</button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {success}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#64748B] hover:text-[#1A202C] border border-[#E4E8F0] hover:bg-[#F7F8FC] transition">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] disabled:opacity-50 transition shadow-sm">
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Saving…
              </>
            ) : isEdit ? "Update" : "Create Question"}
          </button>
        </div>
      </div>
    </form>
  );
}
