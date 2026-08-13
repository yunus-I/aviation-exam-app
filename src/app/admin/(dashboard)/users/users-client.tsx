"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Building,
  UserCheck,
  RefreshCw,
  Edit3,
  CheckCircle2,
  X,
  Phone,
  Send,
} from "lucide-react";
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  PageHeader,
  EmptyState,
} from "@/components/admin/admin-ui";
import { useToast } from "@/components/admin/toat-provider";

export interface Department {
  id: string;
  slug: string;
  code: string;
  name_en: string;
  name_am?: string | null;
}

export interface Candidate {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  current_registration_status: string;
  selected_department_id: string | null;
  created_at: string;
  updated_at: string;
  departments: Department | null;
}

interface UsersClientProps {
  initialCandidates: Candidate[];
  initialDepartments: Department[];
}

const statusVariants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  approved: "success",
  pending_review: "warning",
  rejected: "danger",
  draft: "neutral",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending_review: "Pending Review",
  rejected: "Rejected",
  draft: "Draft",
};

export function UsersClient({
  initialCandidates,
  initialDepartments,
}: UsersClientProps) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [departments] = useState<Department[]>(initialDepartments);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?query=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) {
        throw new Error("Failed to search users");
      }
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err: any) {
      toast("error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchUsers]);

  const handleOpenEditModal = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setSelectedDeptId(candidate.selected_department_id || (departments[0]?.id ?? ""));
  };

  const handleCloseModal = () => {
    setEditingCandidate(null);
    setSelectedDeptId("");
  };

  const handleUpdateDepartment = async () => {
    if (!editingCandidate || !selectedDeptId) return;

    const targetDept = departments.find((d) => d.id === selectedDeptId);
    if (!targetDept) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: editingCandidate.id,
          departmentId: selectedDeptId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update department");
      }

      // Update local state optimistically / with returned record
      setCandidates((prev) =>
        prev.map((c) => (c.id === editingCandidate.id ? data.candidate : c))
      );

      const candidateDisplayName =
        editingCandidate.full_name ||
        [editingCandidate.telegram_first_name, editingCandidate.telegram_last_name]
          .filter(Boolean)
          .join(" ") ||
        `User ${editingCandidate.telegram_user_id}`;

      toast(
        "success",
        `Updated department for ${candidateDisplayName} to ${targetDept.name_en}`
      );
      handleCloseModal();
    } catch (err: any) {
      toast("error", err.message || "Failed to update department");
    } finally {
      setUpdating(false);
    }
  };

  const approvedCount = candidates.filter(
    (c) => c.current_registration_status === "approved"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Users & Department Switch"
        description="Search candidate names or Telegram usernames and update their assigned department."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchUsers(query)}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4" /> Refresh List
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1A202C] tracking-tight">
                {candidates.length}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Total Users Found</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1A202C] tracking-tight">
                {approvedCount}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Approved Active Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1A202C] tracking-tight">
                {departments.length}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Available Departments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Main List */}
      <Card>
        {/* Search Bar */}
        <div className="p-5 border-b border-[#E4E8F0]">
          <div className="relative max-w-md">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search by full name, telegram username or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#1A202C]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1A202C]">
            <thead className="bg-[#F7F8FC] border-b border-[#E4E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Contact / Telegram</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Current Department</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8F0]">
              {loading && candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#003580]" />
                    Searching users...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Users className="w-8 h-8" />}
                      title="No candidates found"
                      description={
                        query
                          ? `No candidates match "${query}". Try searching with a different name or phone number.`
                          : "No candidate records registered yet."
                      }
                    />
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const displayName =
                    c.full_name ||
                    [c.telegram_first_name, c.telegram_last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "Unnamed Candidate";

                  const currentDeptName =
                    c.departments?.name_en || "Not Assigned";

                  return (
                    <tr key={c.id} className="hover:bg-[#F7F8FC] transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A202C]">{displayName}</div>
                        <div className="text-xs text-[#94A3B8]">
                          ID: {c.telegram_user_id}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {c.telegram_username && (
                            <div className="flex items-center gap-1.5 text-xs text-[#003580]">
                              <Send className="w-3 h-3" />
                              @{c.telegram_username}
                            </div>
                          )}
                          {c.phone_number ? (
                            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                              <Phone className="w-3 h-3" />
                              {c.phone_number}
                            </div>
                          ) : (
                            !c.telegram_username && (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Registration Status */}
                      <td className="px-6 py-4">
                        <Badge variant={statusVariants[c.current_registration_status] || "neutral"}>
                          {statusLabels[c.current_registration_status] || c.current_registration_status}
                        </Badge>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-[#003580] border border-blue-100">
                          <Building className="w-3.5 h-3.5" />
                          {currentDeptName}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(c)}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#003580]" />
                          Change Dept
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Department Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E4E8F0] p-6 w-full max-w-lg z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1A202C]">
                  Change Candidate Department
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Update department assignment for Telegram user
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1A202C] hover:bg-[#F7F8FC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Details Card */}
            <div className="bg-[#F7F8FC] rounded-xl p-4 border border-[#E4E8F0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Name:</span>
                <span className="font-semibold text-[#1A202C]">
                  {editingCandidate.full_name ||
                    [editingCandidate.telegram_first_name, editingCandidate.telegram_last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "N/A"}
                </span>
              </div>
              {editingCandidate.telegram_username && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Telegram Username:</span>
                  <span className="font-medium text-[#003580]">
                    @{editingCandidate.telegram_username}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748B]">Current Dept:</span>
                <span className="font-semibold text-[#003580]">
                  {editingCandidate.departments?.name_en || "None"}
                </span>
              </div>
            </div>

            {/* Select Department */}
            <div className="space-y-2">
              <Select
                label="New Department"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name_en} ({dept.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E4E8F0]">
              <Button variant="ghost" size="md" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={updating}
                onClick={handleUpdateDepartment}
              >
                <CheckCircle2 className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
