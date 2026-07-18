"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, FileText, CheckCircle, Clock, Image as ImageIcon, Upload, X, Trash2, ArrowLeft } from "lucide-react";
import { DEPTS, type DeptSlug } from "@/lib/admin/constants";
import { Card, Button, Badge, SectionHeader, Input, Select, ConfirmDialog } from "./admin-ui";
import { useToast } from "./toat-provider";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */
interface ImageItem { id: string; public_url: string; }

interface FlatFormData {
 question_num: number;
 topicSlug: string;
 type: string;
 passage_text: string;
 prompt: string;
 explanation: string;
 optA: string;
 optB: string;
 optC: string;
 optD: string;
 optE: string;
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
 question_num: 0, topicSlug: "", type: "single_choice", passage_text: "", prompt: "", explanation: "",
 optA: "", optB: "", optC: "", optD: "", optE: "", correct: "", duration_minutes: 2,
};

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */
export function FlatQuestionForm({ dept, topics, initialData }: Props) {
 const router = useRouter();
 const { toast } = useToast();
 const isEdit = !!initialData;
 const deptInfo = DEPTS[dept];

 const [form, setForm] = useState<FlatFormData>(initialData ?? defaultForm);
 const [images, setImages] = useState<ImageItem[]>(initialData?.images ?? []);
 const [pendingFile, setPendingFile] = useState<File | null>(null);
 const [saving, setSaving] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [deleteOpen, setDeleteOpen] = useState(false);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const fileRef = useRef<HTMLInputElement>(null);
 const dropRef = useRef<HTMLDivElement>(null);
 const createdId = useRef<string | null>(null);

 useEffect(() => {
 if (isEdit && initialData) {
 fetch(`/api/admin/questions/${initialData.id}/images`)
 .then((r) => r.json())
 .then((d) => { if (d.ok) setImages(d.images); })
 .catch(() => {});
 }
 }, [isEdit, initialData]);

 // Drag and drop handlers
 const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
 const onDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 const f = e.dataTransfer.files?.[0];
 if (f && f.type.startsWith("image/")) handleFileSelected(f);
 }, []);

 function upd<K extends keyof FlatFormData>(k: K, v: FlatFormData[K]) {
 setForm((p) => ({ ...p, [k]: v }));
 if (errors[k]) setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
 }

 function validate(): boolean {
 const e: Record<string, string> = {};
 if (!form.prompt.trim()) e.prompt = "Prompt is required";
 if (!form.topicSlug) e.topicSlug = "Topic is required";
 if (!form.optA.trim()) e.optA = "Option A required";
 if (!form.optB.trim()) e.optB = "Option B required";
 if (!form.correct) e.correct = "Select the correct answer";
 setErrors(e);
 return Object.keys(e).length === 0;
 }

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!validate()) return;
 setSaving(true);

 const options = [
 { option_key: "A", option_text_en: form.optA, is_correct: form.correct === "A" },
 { option_key: "B", option_text_en: form.optB, is_correct: form.correct === "B" },
 { option_key: "C", option_text_en: form.optC || "—", is_correct: form.correct === "C" },
 { option_key: "D", option_text_en: form.optD || "—", is_correct: form.correct === "D" },
 { option_key: "E", option_text_en: form.optE || "—", is_correct: form.correct === "E" },
 ].filter((o) => o.option_text_en !== "—" && o.option_text_en.trim() !== "");

 const body = { ...form, department_id: deptInfo.dbDeptId, options };
 const url = isEdit ? `/api/admin/questions/${initialData!.id}` : "/api/admin/questions";
 const method = isEdit ? "PUT" : "POST";

 try {
 const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
 const data = await res.json();
 if (!res.ok) { toast("error", data.error || "Save failed"); setSaving(false); return; }

 toast("success", isEdit ? "Question updated" : "Question created");

 if (!isEdit && data.id) {
 createdId.current = data.id;
 if (pendingFile) { await handleUpload(pendingFile); setPendingFile(null); }
 setTimeout(() => router.push(`/admin/${dept}/${data.id}/edit`), 600);
 }
 } catch { toast("error", "Network error"); }
 setSaving(false);
 }

 async function handleDelete() {
 if (!initialData) return;
 setSaving(true);
 try {
 const res = await fetch(`/api/admin/questions/${initialData.id}`, { method: "DELETE" });
 if (!res.ok) { toast("error", "Delete failed"); setSaving(false); return; }
 toast("success", "Question deleted");
 router.push(`/admin/${dept}`);
 } catch { toast("error", "Network error"); }
 setSaving(false);
 setDeleteOpen(false);
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
 if (!res.ok) { toast("error", "Upload failed"); setUploading(false); return; }
 const r2 = await fetch(`/api/admin/questions/${qid}/images`);
 const d2 = await r2.json();
 if (d2.ok) { setImages(d2.images); toast("success", "Image uploaded"); }
 } catch { toast("error", "Upload failed"); }
 setUploading(false);
 }

 function handleFileSelected(file: File) {
 if (!file.type.startsWith("image/")) { toast("error", "File must be an image"); return; }
 if (file.size > 5 * 1024 * 1024) { toast("error", "File too large (max 5MB)"); return; }
 if (isEdit || createdId.current) { handleUpload(file); } else { setPendingFile(file); }
 }

 async function handleDeleteImage(imgId: string) {
 if (!initialData) return;
 const res = await fetch(`/api/admin/questions/${initialData.id}/images?mediaId=${imgId}`, { method: "DELETE" });
 if (res.ok) { setImages((p) => p.filter((i) => i.id !== imgId)); toast("success", "Image removed"); }
 else { toast("error", "Failed to remove image"); }
 }

 const fileSizeStr = pendingFile ? `${(pendingFile.size / 1024).toFixed(0)} KB` : "";

 return (
 <>
 <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* ── Left Column: General & Timing ── */}
 <div className="lg:col-span-7 space-y-8">
 {/* ── General Information ── */}
 <Card className="p-6 space-y-5">
 <SectionHeader
 title="General Information"
 description="Basic question details"
 icon={<HelpCircle className="w-4 h-4" />}
 />

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Input label="Question #" type="number" value={form.question_num} onChange={(e) => upd("question_num", parseInt(e.target.value) || 0)} min={1} />
 <Select label="Topic *" value={form.topicSlug} onChange={(e) => upd("topicSlug", e.target.value)} required>
 <option value="">Select topic…</option>
 {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name_en}</option>)}
 </Select>
 <Select label="Type" value={form.type} onChange={(e) => upd("type", e.target.value)}>
 <option value="single_choice">Single Choice</option>
 <option value="multiple_choice">Multiple Choice</option>
 <option value="true_false">True / False</option>
 </Select>
 </div>
 {errors.topicSlug && <p className="text-xs text-red-500 -mt-3">{errors.topicSlug}</p>}

 <div>
 <Input label="Passage (Optional)" value={form.passage_text} onChange={(e) => upd("passage_text", e.target.value)} rows={3} placeholder="Read the passage and answer the questions..." />
 <p className="text-xs text-[#94A3B8] mt-1">If this question belongs to a passage, enter the text here.</p>
 </div>

 <div>
 <Input label="Prompt *" value={form.prompt} onChange={(e) => upd("prompt", e.target.value)} rows={3} required />
 {errors.prompt && <p className="text-xs text-red-500 mt-1">{errors.prompt}</p>}
 </div>

 <Input label="Explanation" value={form.explanation} onChange={(e) => upd("explanation", e.target.value)} rows={2} />
 </Card>

 {/* ── Timing & Media ── */}
 <Card className="p-6 space-y-5">
 <SectionHeader
 title="Timing & Media"
 description="Duration and question image"
 icon={<Clock className="w-4 h-4" />}
 />

 <div className="max-w-xs">
 <Input label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(e) => upd("duration_minutes", parseInt(e.target.value) || 1)} min={1} max={60} />
 </div>

 {/* Image upload */}
 <div>
 <p className="text-xs font-semibold text-[#1A202C] mb-2">Question Image</p>

 {images.length === 0 && !pendingFile && (
 <div
 ref={dropRef}
 onDragOver={onDragOver}
 onDrop={onDrop}
 onClick={() => fileRef.current?.click()}
 className="border-2 border-dashed border-[#E4E8F0] rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#003580] hover:admin-icon-wrap transition-all duration-200 group"
 >
 <div className="w-12 h-12 rounded-2xl bg-[#F7F8FC] flex items-center justify-center text-[#94A3B8] group-hover:text-[#003580] group-hover:admin-icon-wrap transition">
 <Upload className="w-5 h-5" />
 </div>
 <div className="text-center">
 <p className="text-sm font-semibold text-[#1A202C] group-hover:text-[#003580] transition">Upload an image</p>
 <p className="text-xs text-[#94A3B8] mt-0.5">Drag & drop or click to browse (max 5MB)</p>
 </div>
 </div>
 )}

 {(pendingFile || images.length > 0) && (
 <div className="relative inline-block rounded-xl overflow-hidden border border-[#E4E8F0] bg-[#F7F8FC] p-2">
 {/* Preview */}
 {pendingFile && (
 <div className="flex flex-col items-center gap-2 p-4">
 <ImageIcon className="w-8 h-8 text-[#94A3B8]" />
 <div className="text-center">
 <p className="text-xs font-medium text-[#1A202C]">{pendingFile.name}</p>
 <p className="text-[10px] text-[#94A3B8]">{fileSizeStr}</p>
 </div>
 {!isEdit && (
 <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 font-medium">
 Will upload after creation
 </div>
 )}
 </div>
 )}
 {images.length > 0 && (
 <div className="relative group">
 <img src={images[0].public_url} alt="" className="max-h-48 object-contain rounded-lg" />
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition rounded-lg flex items-center justify-center gap-2">
 <button type="button" onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-[#64748B] hover:text-[#003580] opacity-0 group-hover:opacity-100 transition shadow-sm">
 <Upload className="w-4 h-4" />
 </button>
 <button type="button" onClick={() => handleDeleteImage(images[0].id)} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition shadow-sm">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 )}

 <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ""; }} />
 </div>
 </Card>
 </div>

 {/* ── Right Column: Options ── */}
 <div className="lg:col-span-5">
 <Card className="p-6 space-y-5 sticky top-6">
 <SectionHeader
 title="Answer Options"
 description="Define the options and mark the correct one"
 icon={<CheckCircle className="w-4 h-4" />}
 />

 <div className="grid grid-cols-1 gap-4">
 {(["A", "B", "C", "D", "E"] as const).map((key) => (
 <div key={key} className="flex items-start gap-3 p-4 rounded-xl border border-[#E4E8F0] bg-[#F7F8FC]/30">
 <div className="flex flex-col items-center gap-2 pt-0.5">
 <input
 type="radio" name="correct" checked={form.correct === key}
 onChange={() => upd("correct", key)}
 className="w-4 h-4 accent-brand"
 />
 <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${form.correct === key ? "admin-logo-sq text-white" : "bg-[#E4E8F0] text-[#64748B]"}`}>{key}</span>
 </div>
 <div className="flex-1">
 <Input value={form[`opt${key}` as keyof FlatFormData] as string} onChange={(e) => upd(`opt${key}` as keyof FlatFormData, e.target.value) as any} placeholder={key === "E" ? `Option E text (Optional)…` : `Option ${key} text…`} />
 {errors[`opt${key}` as keyof FlatFormData] && <p className="text-xs text-red-500 mt-1">{errors[`opt${key}` as keyof FlatFormData]}</p>}
 </div>
 </div>
 ))}
 </div>
 {errors.correct && <p className="text-xs text-red-500">{errors.correct}</p>}
 <p className="text-xs text-[#94A3B8]">Select the radio button next to the correct answer.</p>
 </Card>
 </div>
 </div>

 {/* ── Actions ── */}
 <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
 <div>
 {isEdit && (
 <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)} disabled={saving}>
 <Trash2 className="w-4 h-4" />
 Delete
 </Button>
 )}
 </div>
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="md" onClick={() => router.back()} type="button">
 <ArrowLeft className="w-4 h-4" />
 Cancel
 </Button>
 <Button variant="primary" size="lg" loading={saving} type="submit">
 {isEdit ? "Update Question" : "Create Question"}
 </Button>
 </div>
 </div>
 </form>

 {/* Delete confirm */}
 <ConfirmDialog
 open={deleteOpen}
 onClose={() => setDeleteOpen(false)}
 onConfirm={handleDelete}
 title="Delete Question"
 description="This will permanently delete this question, its options, and any associated images. This action cannot be undone."
 confirmLabel="Delete"
 confirmVariant="danger"
 loading={saving}
 />
 </>
 );
}
