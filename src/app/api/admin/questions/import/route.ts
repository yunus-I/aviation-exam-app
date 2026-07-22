import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  return lines.map((line) => parseCsvLine(line));
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const departmentId = formData.get("department_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!departmentId) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or has no data rows" }, { status: 400 });
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const promptIdx = headers.indexOf("prompt");
    const correctIdx = headers.indexOf("correct");
    const optAIdx = headers.indexOf("opta");
    const optBIdx = headers.indexOf("optb");
    const optCIdx = headers.indexOf("optc");
    const optDIdx = headers.indexOf("optd");
    const typeIdx = headers.indexOf("type");
    const numIdx = headers.indexOf("question_num");
    const explanationIdx = headers.indexOf("explanation");
    const topicSlugIdx = headers.indexOf("topicslug");
    const durationIdx = headers.indexOf("duration_minutes");

    if (promptIdx === -1 || correctIdx === -1 || optAIdx === -1 || optBIdx === -1) {
      return NextResponse.json(
        { error: "CSV must have columns: prompt, correct, optA, optB" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient() as any;

    // Resolve question_bank_id
    let question_bank_id: string | null = null;
    const { data: existingBank } = await supabase
      .from("question_banks")
      .select("id")
      .eq("department_id", departmentId)
      .maybeSingle();
    if (existingBank) {
      question_bank_id = existingBank.id;
    } else {
      const { data: newBank } = await supabase
        .from("question_banks")
        .insert({
          slug: `admin-bank-${departmentId.slice(0, 8)}`,
          title_en: "Admin Questions",
          department_id: departmentId,
          is_active: true,
        })
        .select("id")
        .single();
      if (newBank) question_bank_id = newBank.id;
    }

    // Resolve default topic for this department
    let default_topic_id: string | null = null;

    // Get published exam set for linking
    const { data: examSet } = await supabase
      .from("exam_sets")
      .select("id")
      .eq("department_id", departmentId)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    // Get current count for sort_order
    let baseSortOrder = 0;
    if (examSet) {
      const { count } = await supabase
        .from("exam_set_questions")
        .select("id", { count: "exact", head: true })
        .eq("exam_set_id", examSet.id);
      baseSortOrder = count ?? 0;
    }

    const imported: number[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const prompt = row[promptIdx]?.trim();
      const correct = row[correctIdx]?.trim().toUpperCase();

      if (!prompt) {
        errors.push({ row: i + 1, error: "Missing prompt" });
        continue;
      }

      if (!correct || !["A", "B", "C", "D"].includes(correct)) {
        errors.push({ row: i + 1, error: "Invalid correct option" });
        continue;
      }

      const optA = row[optAIdx]?.trim();
      const optB = row[optBIdx]?.trim();
      if (!optA || !optB) {
        errors.push({ row: i + 1, error: "Options A and B are required" });
        continue;
      }

      // Resolve topic if provided
      let topic_id: string | null = default_topic_id;
      const topicSlug = topicSlugIdx !== -1 ? row[topicSlugIdx]?.trim() : null;
      if (topicSlug) {
        const { data: topic } = await supabase
          .from("topics")
          .select("id")
          .eq("slug", topicSlug)
          .maybeSingle();
        if (topic) topic_id = topic.id;
      }

      const questionType = typeIdx !== -1 && row[typeIdx]?.trim()
        ? row[typeIdx].trim()
        : "single_choice";

      const questionNum = numIdx !== -1 && row[numIdx]?.trim()
        ? parseInt(row[numIdx].trim(), 10)
        : null;

      const explanation = explanationIdx !== -1 ? row[explanationIdx]?.trim() || null : null;
      const duration = durationIdx !== -1 && row[durationIdx]?.trim()
        ? parseInt(row[durationIdx].trim(), 10)
        : 2;

      const { data: question, error: qError } = await supabase
        .from("questions")
        .insert({
          question_bank_id,
          department_id: departmentId,
          topic_id,
          question_type: questionType,
          prompt_en: prompt,
          explanation_en: explanation,
          question_num: questionNum,
          duration_minutes: duration,
          is_active: true,
          created_by_admin_id: admin.id,
        })
        .select("id")
        .single();

      if (qError) {
        errors.push({ row: i + 1, error: qError.message });
        continue;
      }

      // Insert options
      const options = [
        { option_key: "A", option_text_en: optA, is_correct: correct === "A", sort_order: 1 },
        { option_key: "B", option_text_en: optB, is_correct: correct === "B", sort_order: 2 },
      ];

      if (optCIdx !== -1 && row[optCIdx]?.trim()) {
        options.push({ option_key: "C", option_text_en: row[optCIdx].trim(), is_correct: correct === "C", sort_order: 3 });
      }
      if (optDIdx !== -1 && row[optDIdx]?.trim()) {
        options.push({ option_key: "D", option_text_en: row[optDIdx].trim(), is_correct: correct === "D", sort_order: 4 });
      }

      const { error: oError } = await supabase
        .from("question_options")
        .insert(
          options.map((opt) => ({
            question_id: question.id,
            ...opt,
          })),
        );

      if (oError) {
        errors.push({ row: i + 1, error: `Options error: ${oError.message}` });
        continue;
      }

      // Link to exam set
      if (examSet) {
        baseSortOrder++;
        await supabase.from("exam_set_questions").insert({
          exam_set_id: examSet.id,
          question_id: question.id,
          sort_order: baseSortOrder,
        });
      }

      imported.push(i + 1);
    }

    return NextResponse.json({
      ok: true,
      imported: imported.length,
      errors,
      total: rows.length - 1,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
