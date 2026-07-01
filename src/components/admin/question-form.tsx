"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface ImageItem {
  id: string;
  storage_path: string;
  alt_text_en: string;
  alt_text_am: string;
  sort_order: number;
  public_url: string;
}

interface Option {
  option_key: string;
  option_text_en: string;
  option_text_am: string;
  is_correct: boolean;
}

interface FormData {
  question_bank_id: string;
  department_id: string;
  topic_id: string;
  question_type: string;
  prompt_en: string;
  prompt_am: string;
  explanation_en: string;
  explanation_am: string;
  source_label: string;
  source_year: string;
  is_active: boolean;
}

interface QuestionFormProps {
  initialData?: FormData & { id: string; options: Option[] };
  banks: { id: string; title_en: string }[];
  departments: { id: string; name_en: string }[];
  topics: { id: string; name_en: string }[];
}

const QUESTION_TYPES = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
];

const defaultForm: FormData = {
  question_bank_id: "",
  department_id: "",
  topic_id: "",
  question_type: "single_choice",
  prompt_en: "",
  prompt_am: "",
  explanation_en: "",
  explanation_am: "",
  source_label: "",
  source_year: "",
  is_active: true,
};

function buildDefaultOptions(type: string): Option[] {
  if (type === "true_false") {
    return [
      { option_key: "True", option_text_en: "True", option_text_am: "እውነት", is_correct: false },
      { option_key: "False", option_text_en: "False", option_text_am: "ሐሰት", is_correct: false },
    ];
  }
  return [
    { option_key: "A", option_text_en: "", option_text_am: "", is_correct: false },
    { option_key: "B", option_text_en: "", option_text_am: "", is_correct: false },
    { option_key: "C", option_text_en: "", option_text_am: "", is_correct: false },
    { option_key: "D", option_text_en: "", option_text_am: "", is_correct: false },
  ];
}

export function QuestionForm({ initialData, banks, departments, topics }: QuestionFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState<FormData>(initialData ?? defaultForm);
  const [options, setOptions] = useState<Option[]>(
    initialData?.options ?? buildDefaultOptions("single_choice"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialData) {
      setOptions(buildDefaultOptions(form.question_type));
    }
  }, [form.question_type, initialData]);

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/admin/questions/${initialData.id}/images`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setImages(data.images);
        })
        .catch(() => {});
    }
  }, [isEdit, initialData?.id]);

  async function handleUpload(file: File) {
    if (!initialData) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("question_id", initialData.id);

    try {
      const res = await fetch("/api/admin/questions/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setUploading(false);
        return;
      }

      const getRes = await fetch(`/api/admin/questions/${initialData.id}/images`);
      const getData = await getRes.json();
      if (getData.ok) setImages(getData.images);
    } catch {
      setError("Upload failed.");
    }

    setUploading(false);
  }

  async function handleDeleteImage(imageId: string) {
    if (!initialData) return;

    const res = await fetch(
      `/api/admin/questions/${initialData.id}/images?mediaId=${imageId}`,
      { method: "DELETE" },
    );

    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete image.");
    }
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateOption(index: number, field: keyof Option, value: string | boolean) {
    setOptions((prev) => {
      const next = prev.map((o, i) => (i === index ? { ...o, [field]: value } : o));

      if (form.question_type === "single_choice" && field === "is_correct" && value === true) {
        return next.map((o, i) => ({ ...o, is_correct: i === index }));
      }

      return next;
    });
  }

  function addOption() {
    const key = String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { option_key: key, option_text_en: "", option_text_am: "", is_correct: false }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!form.prompt_en.trim()) {
      setError("Prompt (English) is required.");
      setSaving(false);
      return;
    }

    if (!form.question_bank_id) {
      setError("Please select a question bank.");
      setSaving(false);
      return;
    }

    if (options.length === 0) {
      setError("At least one option is required.");
      setSaving(false);
      return;
    }

    const hasCorrect = options.some((o) => o.is_correct);
    if (!hasCorrect) {
      setError("Please mark at least one option as correct.");
      setSaving(false);
      return;
    }

    const url = isEdit ? `/api/admin/questions/${initialData.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save question.");
        setSaving(false);
        return;
      }

      setSuccess(isEdit ? "Question updated." : "Question created.");
      setSaving(false);

      if (!isEdit && data.id) {
        setTimeout(() => router.push(`/admin/questions/${data.id}/edit`), 800);
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this question permanently?")) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/questions/${initialData!.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete.");
        setSaving(false);
        return;
      }
      router.push("/admin/questions");
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition";
  const labelClass = "text-xs font-semibold text-[#1A202C]";
  const selectClass = inputClass + " bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#003580] tracking-wide uppercase flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Question Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Question Bank *</label>
            <select
              value={form.question_bank_id}
              onChange={(e) => updateField("question_bank_id", e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select bank...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.title_en}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Department</label>
            <select
              value={form.department_id}
              onChange={(e) => updateField("department_id", e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name_en}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Topic</label>
            <select
              value={form.topic_id}
              onChange={(e) => updateField("topic_id", e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name_en}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Type</label>
            <select
              value={form.question_type}
              onChange={(e) => updateField("question_type", e.target.value)}
              className={selectClass}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Status</label>
            <select
              value={form.is_active ? "true" : "false"}
              onChange={(e) => updateField("is_active", e.target.value === "true")}
              className={selectClass}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Prompt (English) *</label>
          <textarea
            value={form.prompt_en}
            onChange={(e) => updateField("prompt_en", e.target.value)}
            rows={3}
            className={inputClass + " resize-y"}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Prompt (Amharic)</label>
          <textarea
            value={form.prompt_am}
            onChange={(e) => updateField("prompt_am", e.target.value)}
            rows={2}
            className={inputClass + " resize-y"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Explanation (English)</label>
          <textarea
            value={form.explanation_en}
            onChange={(e) => updateField("explanation_en", e.target.value)}
            rows={2}
            className={inputClass + " resize-y"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Explanation (Amharic)</label>
          <textarea
            value={form.explanation_am}
            onChange={(e) => updateField("explanation_am", e.target.value)}
            rows={2}
            className={inputClass + " resize-y"}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Source Label</label>
            <input
              type="text"
              value={form.source_label}
              onChange={(e) => updateField("source_label", e.target.value)}
              placeholder="e.g. EAU Entrance"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Source Year</label>
            <input
              type="number"
              value={form.source_year}
              onChange={(e) => updateField("source_year", e.target.value)}
              placeholder="e.g. 2025"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#003580] tracking-wide uppercase flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Answer Options
          </h2>
          {form.question_type !== "true_false" && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#003580] hover:text-[#00276B] transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Option
            </button>
          )}
        </div>

        <div className="space-y-3">
          {options.map((opt, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[#F7F8FC] rounded-lg">
              <div className="flex items-center gap-2 pt-1">
                <input
                  type={form.question_type === "multiple_choice" ? "checkbox" : "radio"}
                  name="correct_option"
                  checked={opt.is_correct}
                  onChange={() => updateOption(i, "is_correct", !opt.is_correct)}
                  className="w-4 h-4 accent-[#003580]"
                />
                <span className="text-xs font-bold text-[#64748B] w-5">{opt.option_key}</span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={opt.option_text_en}
                  onChange={(e) => updateOption(i, "option_text_en", e.target.value)}
                  placeholder="Option text (English)"
                  className="w-full px-3 py-1.5 border border-[#E4E8F0] rounded-md text-sm focus:border-[#003580] outline-none transition"
                />
                <input
                  type="text"
                  value={opt.option_text_am}
                  onChange={(e) => updateOption(i, "option_text_am", e.target.value)}
                  placeholder="Option text (አማርኛ)"
                  className="w-full px-3 py-1.5 border border-[#E4E8F0] rounded-md text-sm focus:border-[#003580] outline-none transition"
                />
              </div>
              {form.question_type !== "true_false" && options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-xs text-red-500 hover:text-red-700 pt-1.5 flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEdit && (
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#003580] tracking-wide uppercase flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Images
            </h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#003580] hover:text-[#00276B] disabled:opacity-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {uploading ? "Uploading..." : "Add Image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No images uploaded.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[#E4E8F0] bg-[#F7F8FC]">
                  <img
                    src={img.public_url}
                    alt={img.alt_text_en || "Question image"}
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#64748B] hover:text-[#1A202C] border border-[#E4E8F0] hover:bg-[#F7F8FC] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] disabled:opacity-50 transition shadow-sm"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Saving...
              </>
            ) : isEdit ? "Update Question" : "Create Question"}
          </button>
        </div>
      </div>
    </form>
  );
}
