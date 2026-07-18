"use client";

import Link from "next/link";
import { Edit, Trash2, HelpCircle, FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, EmptyState, ConfirmDialog } from "@/components/admin/admin-ui";
import { useToast } from "@/components/admin/toat-provider";
import type { DeptSlug, DeptInfo } from "@/lib/admin/constants";

interface Props {
 dept: DeptSlug;
 questions: any[];
 totalPages: number;
 page: number;
 search: string;
 typeLabel: Record<string, string>;
}

export function DeptQuestionsClient({ dept, questions, totalPages, page, search, typeLabel }: Props) {
 const router = useRouter();
 const { toast } = useToast();
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [deleting, setDeleting] = useState(false);

 async function handleDelete() {
 if (!deleteId) return;
 setDeleting(true);
 try {
 const res = await fetch(`/api/admin/questions/${deleteId}`, { method: "DELETE" });
 if (!res.ok) { toast("error", "Failed to delete question"); setDeleting(false); return; }
 toast("success", "Question deleted");
 setDeleteId(null);
 router.refresh();
 } catch { toast("error", "Network error"); }
 setDeleting(false);
 }

 return (
 <>
 <Card>
 {questions.length === 0 ? (
 <EmptyState
 icon={<HelpCircle className="w-6 h-6" />}
 title="No questions found"
 description={search ? "Try a different search term" : "Add your first question to get started"}
 action={
 <Link href={`/admin/${dept}/new`}>
 <Button variant="primary" size="md">
 <FileText className="w-4 h-4" />
 Create Question
 </Button>
 </Link>
 }
 />
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[#E4E8F0] bg-[#F7F8FC]">
 <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-14">#</th>
 <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Topic</th>
 <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-16">Type</th>
 <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Prompt</th>
 <th className="text-right px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-28">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E4E8F0]">
 {questions.map((q: any, i: number) => (
 <tr key={q.id} className="hover:bg-[#F7F8FC]/50 transition group">
 <td className="px-5 py-4 text-[#64748B] font-mono text-xs">{q.question_num ?? "—"}</td>
 <td className="px-5 py-4">
 <Badge variant="neutral">{(q.topic as any)?.name_en ?? "—"}</Badge>
 </td>
 <td className="px-5 py-4">
 <Badge variant="default">{typeLabel[q.question_type] || q.question_type}</Badge>
 </td>
 <td className="px-5 py-4 max-w-md">
 <div className="truncate font-medium text-[#1A202C] group-hover:text-[#003580] transition-colors">
 {q.prompt_en || "Untitled"}
 </div>
 </td>
 <td className="px-5 py-4 text-right">
 <div className="flex items-center justify-end gap-1.5">
 <Link
 href={`/admin/${dept}/${q.id}/edit`}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#003580] hover:admin-icon-wrap transition"
 >
 <Edit className="w-3.5 h-3.5" />
 Edit
 </Link>
 <button
 onClick={() => setDeleteId(q.id)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-red-600 hover:bg-red-50 transition"
 >
 <Trash2 className="w-3.5 h-3.5" />
 Delete
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between px-5 py-4 border-t border-[#E4E8F0]">
 <p className="text-xs text-[#64748B]">Page {page} of {totalPages}</p>
 <div className="flex items-center gap-2">
 {page > 1 && (
 <Link href={`/admin/${dept}?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] hover:border-[#003580] transition">
 Previous
 </Link>
 )}
 {page < totalPages && (
 <Link href={`/admin/${dept}?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] hover:border-[#003580] transition">
 Next
 </Link>
 )}
 </div>
 </div>
 )}
 </Card>

 <ConfirmDialog
 open={!!deleteId}
 onClose={() => setDeleteId(null)}
 onConfirm={handleDelete}
 title="Delete Question"
 description="This will permanently delete this question and its options. This action cannot be undone."
 confirmLabel="Delete"
 confirmVariant="danger"
 loading={deleting}
 >
 {deleteId && (() => {
 const q = questions.find((x: any) => x.id === deleteId);
 return q ? (
 <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E4E8F0] mt-2">
 <p className="text-xs font-medium text-[#1A202C] line-clamp-2">{q.prompt_en || "Untitled"}</p>
 </div>
 ) : null;
 })()}
 </ConfirmDialog>
 </>
 );
}
