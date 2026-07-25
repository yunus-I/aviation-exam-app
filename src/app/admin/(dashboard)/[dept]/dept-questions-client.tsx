"use client";

import Link from "next/link";
import { Edit, Trash2, HelpCircle, FileText, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, EmptyState, ConfirmDialog } from "@/components/admin/admin-ui";
import { useToast } from "@/components/admin/toat-provider";
import type { DeptSlug } from "@/lib/admin/constants";

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

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const currentPageIds = useMemo(() => questions.map((q: any) => q.id), [questions]);

  const isAllSelected =
    questions.length > 0 && currentPageIds.every((id: string) => selectedIds.includes(id));
  const isSomeSelected =
    questions.some((q: any) => selectedIds.includes(q.id)) && !isAllSelected;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast("error", "Failed to delete question");
        setDeleting(false);
        return;
      }
      toast("success", "Question deleted");
      setDeleteId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId));
      router.refresh();
    } catch {
      toast("error", "Network error");
    }
    setDeleting(false);
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to delete selected questions");
        setBatchDeleting(false);
        return;
      }

      toast("success", `Successfully deleted ${selectedIds.length} question(s)`);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
      router.refresh();
    } catch {
      toast("error", "Network error");
    }
    setBatchDeleting(false);
  }

  const selectedQuestions = useMemo(() => {
    return questions.filter((q: any) => selectedIds.includes(q.id));
  }, [questions, selectedIds]);

  return (
    <>
      <Card>
        {/* Bulk Action Header Bar when questions are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#003580]/[0.05] border-b border-[#E4E8F0] animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center bg-[#003580] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {selectedIds.length} selected
              </span>
              <span className="text-xs font-medium text-[#1A202C]">
                {selectedIds.length === 1 ? "1 question selected" : `${selectedIds.length} questions selected`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#1A202C] hover:bg-white/80 transition"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBatchDeleteModal(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}

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
                  <th className="text-center px-4 py-3.5 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#003580] focus:ring-[#003580] cursor-pointer accent-[#003580]"
                      title={isAllSelected ? "Deselect all on this page" : "Select all on this page"}
                    />
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-14">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Topic</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-16">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Prompt</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F0]">
                {questions.map((q: any) => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`transition group ${
                        isSelected
                          ? "bg-[#003580]/[0.06] hover:bg-[#003580]/[0.09]"
                          : "hover:bg-[#F7F8FC]/50"
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(q.id)}
                          className="w-4 h-4 rounded border-[#CBD5E1] text-[#003580] focus:ring-[#003580] cursor-pointer accent-[#003580]"
                        />
                      </td>
                      <td className="px-4 py-4 text-[#64748B] font-mono text-xs">{q.question_num ?? "—"}</td>
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
                            type="button"
                            onClick={() => setDeleteId(q.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Single Question Delete Dialog */}
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

      {/* Batch Questions Delete Dialog */}
      <ConfirmDialog
        open={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedIds.length} Question${selectedIds.length > 1 ? "s" : ""}`}
        description={`Are you sure you want to permanently delete the ${selectedIds.length} selected question${selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Question${selectedIds.length > 1 ? "s" : ""}`}
        confirmVariant="danger"
        loading={batchDeleting}
      >
        <div className="p-3 bg-[#F7F8FC] rounded-xl border border-[#E4E8F0] mt-2 max-h-48 overflow-y-auto space-y-1.5">
          {selectedQuestions.slice(0, 5).map((q: any) => (
            <div key={q.id} className="p-2 bg-white rounded-lg border border-[#E4E8F0]">
              <p className="text-xs font-medium text-[#1A202C] line-clamp-1">
                {q.question_num ? `#${q.question_num}: ` : ""}{q.prompt_en || "Untitled"}
              </p>
            </div>
          ))}
          {selectedIds.length > selectedQuestions.slice(0, 5).length && (
            <p className="text-center text-xs font-semibold text-[#64748B] pt-1">
              ...and {selectedIds.length - selectedQuestions.slice(0, 5).length} more question{selectedIds.length - selectedQuestions.slice(0, 5).length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
