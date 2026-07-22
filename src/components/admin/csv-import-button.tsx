"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./admin-ui";
import { useToast } from "./toat-provider";
import type { DeptSlug } from "@/lib/admin/constants";

interface Props {
  dept: DeptSlug;
  departmentId: string;
  onImported?: () => void;
}

export function CsvImportButton({ dept, departmentId, onImported }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast("error", "Please select a CSV file");
      return;
    }

    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("department_id", departmentId);

    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        toast("error", data.error || "Import failed");
      } else if (data.errors?.length > 0) {
        const firstErrors = data.errors.slice(0, 3).map((e: any) => `Row ${e.row}: ${e.error}`).join("; ");
        const more = data.errors.length > 3 ? ` (+${data.errors.length - 3} more)` : "";
        toast("error", `Imported ${data.imported}/${data.total}. Errors: ${firstErrors}${more}`);
      } else {
        toast("success", `Successfully imported ${data.imported} questions`);
      }

      if (onImported) onImported();
    } catch {
      toast("error", "Network error during import");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="md"
        loading={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>
    </>
  );
}
