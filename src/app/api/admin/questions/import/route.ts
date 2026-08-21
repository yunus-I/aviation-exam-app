import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { parse } from "csv-parse/sync";

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
  try {
    const records = parse(text, {
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as string[][];
    if (records && records.length > 0) {
      return records;
    }
  } catch {
    // Fallback if csv-parse encounters malformed syntax
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  return lines.map((line) => parseCsvLine(line));
}

function findHeaderIdx(headers: string[], ...aliases: string[]): number {
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = headers.findIndex((h) => {
      const cleanH = h.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanH === cleanAlias;
    });
    if (idx !== -1) return idx;
  }
  return -1;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

    const headers = rows[0].map((h) => h.trim());

    const promptIdx = findHeaderIdx(headers, "prompt", "question", "prompt_en", "prompten", "stem", "text");
    const correctIdx = findHeaderIdx(headers, "correct", "correct_answer", "answer", "ans", "key", "correctoption");
    const optAIdx = findHeaderIdx(headers, "opta", "opt_a", "option_a", "optiona", "a");
    const optBIdx = findHeaderIdx(headers, "optb", "opt_b", "option_b", "optionb", "b");
    const optCIdx = findHeaderIdx(headers, "optc", "opt_c", "option_c", "optionc", "c");
    const optDIdx = findHeaderIdx(headers, "optd", "opt_d", "option_d", "optiond", "d");
    const optEIdx = findHeaderIdx(headers, "opte", "opt_e", "option_e", "optione", "e");
    const instructionIdx = findHeaderIdx(headers, "instruction", "instruction_text", "instructions", "direction", "directions", "instructiontext");
    const typeIdx = findHeaderIdx(headers, "type", "question_type", "questiontype", "qtype");
    const numIdx = findHeaderIdx(headers, "question_num", "questionnum", "num", "number", "qnum", "q_num", "-question_num");
    const explanationIdx = findHeaderIdx(headers, "explanation", "explanation_en", "explanation_text", "explanationtext", "exp", "reason");
    const topicIdx = findHeaderIdx(headers, "topic", "topics", "topic_slug", "topic_name", "category", "subject");
    const durationIdx = findHeaderIdx(headers, "duration_minutes", "durationminutes", "duration", "duration_min", "time", "time_minutes");
    const passageIdx = findHeaderIdx(headers, "passage", "passage_text", "passages", "reading_passage", "context");

    const missing: string[] = [];
    if (promptIdx === -1) missing.push("prompt");
    if (correctIdx === -1) missing.push("correct");
    if (optAIdx === -1) missing.push("optA");
    if (optBIdx === -1) missing.push("optB");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missing.join(", ")}. Found headers: [${headers.join(", ")}]` },
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
        .upsert(
          {
            slug: `admin-bank-${departmentId.slice(0, 8)}`,
            title_en: "Admin Questions",
            department_id: departmentId,
            is_active: true,
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single();
      if (newBank) question_bank_id = newBank.id;
    }

    // Cache for resolved topics to avoid repeated lookups
    const topicCache: Record<string, string | null> = {};

    async function resolveTopicId(topicName: string | null): Promise<string | null> {
      if (!topicName) return null;
      const cacheKey = topicName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (topicCache[cacheKey] !== undefined) return topicCache[cacheKey];

      const normalizedInput = topicName.toLowerCase().replace(/[^a-z0-9]/g, "");

      // 1. Exact name match (case-insensitive)
      const { data: byName } = await supabase
        .from("topics")
        .select("id, name_en")
        .ilike("name_en", topicName)
        .maybeSingle();
      if (byName) {
        topicCache[cacheKey] = byName.id;
        return byName.id;
      }

      // 2. Fetch all topics and match by normalized name
      const { data: allTopics } = await supabase
        .from("topics")
        .select("id, name_en, slug");
      if (allTopics?.length) {
        const match = allTopics.find((t: any) => {
          const normalizedDbName = t.name_en.toLowerCase().replace(/[^a-z0-9]/g, "");
          const normalizedDbSlug = t.slug.toLowerCase().replace(/[^a-z0-9]/g, "");
          return normalizedDbName === normalizedInput || normalizedDbSlug === normalizedInput;
        });
        if (match) {
          topicCache[cacheKey] = match.id;
          return match.id;
        }
      }

      // 3. Create new topic
      const slug = slugify(topicName);
      const { data: newTopic } = await supabase
        .from("topics")
        .upsert(
          { slug, name_en: topicName, is_active: true },
          { onConflict: "slug" },
        )
        .select("id")
        .single();

      topicCache[cacheKey] = newTopic?.id ?? null;
      return newTopic?.id ?? null;
    }

    const imported: number[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const prompt = row[promptIdx]?.trim();
      const correct = row[correctIdx]?.trim().toUpperCase();

      if (!prompt) {
        errors.push({ row: i + 1, error: `Missing prompt. cols=${row.length}, val[0..2]=${row.slice(0,3).map(v=>`"${v?.substring(0,20)}"`)}` });
        continue;
      }

      if (!correct || !["A", "B", "C", "D", "E"].includes(correct)) {
        errors.push({ row: i + 1, error: `Invalid correct="${row[correctIdx]?.trim()}" (must be A-E). prompt="${prompt?.substring(0,30)}"` });
        continue;
      }

      const optA = row[optAIdx]?.trim();
      const optB = row[optBIdx]?.trim();
      if (!optA || !optB) {
        errors.push({ row: i + 1, error: `Missing options. optA="${optA?.substring(0,20)}" optB="${optB?.substring(0,20)}"` });
        continue;
      }

      // Resolve topic
      const topicName = topicIdx !== -1 ? row[topicIdx]?.trim() || null : null;
      const topic_id = await resolveTopicId(topicName);

      const rawType = typeIdx !== -1 && row[typeIdx]?.trim()
        ? row[typeIdx].trim()
        : "single_choice";
      const typeMap: Record<string, string> = {
        "multiple choice": "multiple_choice",
        "single choice": "single_choice",
        "true false": "true_false",
        "true/false": "true_false",
      };
      const questionType = typeMap[rawType.toLowerCase()] || rawType;

      const questionNum = numIdx !== -1 && row[numIdx]?.trim()
        ? parseInt(row[numIdx].trim(), 10)
        : null;

      const instruction = instructionIdx !== -1 ? row[instructionIdx]?.trim() || null : null;
      const explanation = explanationIdx !== -1 ? row[explanationIdx]?.trim() || null : null;
      const passage = passageIdx !== -1 ? row[passageIdx]?.trim() || null : null;
      const duration = durationIdx !== -1 && row[durationIdx]?.trim()
        ? parseInt(row[durationIdx].trim(), 10)
        : 1;

      let insertPayload: Record<string, any> = {
        question_bank_id,
        department_id: departmentId,
        topic_id,
        question_type: questionType,
        instruction_text: instruction,
        passage_text: passage,
        prompt_en: prompt,
        explanation_en: explanation,
        question_num: questionNum,
        duration_minutes: duration,
        is_active: true,
        created_by_admin_id: admin.id,
      };

      let { data: question, error: qError } = await supabase
        .from("questions")
        .insert(insertPayload)
        .select("id")
        .single();

      if (qError && (qError.code === "42703" || qError.message?.includes("instruction_text"))) {
        delete insertPayload.instruction_text;
        const retry = await supabase
          .from("questions")
          .insert(insertPayload)
          .select("id")
          .single();
        question = retry.data;
        qError = retry.error;
      }

      if (qError && (qError.code === "42703" || qError.message?.includes("passage_text"))) {
        delete insertPayload.passage_text;
        const retry = await supabase
          .from("questions")
          .insert(insertPayload)
          .select("id")
          .single();
        question = retry.data;
        qError = retry.error;
      }

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
      if (optEIdx !== -1 && row[optEIdx]?.trim()) {
        options.push({ option_key: "E", option_text_en: row[optEIdx].trim(), is_correct: correct === "E", sort_order: 5 });
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

      // Link to exam set based on topic
      if (topic_id) {
        // Find or create exam set for this topic+department
        const topicSlug = topicName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";
        let { data: topicExamSet } = await supabase
          .from("exam_sets")
          .select("id")
          .eq("department_id", departmentId)
          .eq("topic_id", topic_id)
          .maybeSingle();

        if (!topicExamSet) {
          // Determine mode: exam topics -> mock, practice topics -> practice
          const mode = topicSlug.startsWith("exam") ? "mock" : "practice";
          const { data: newEs } = await supabase
            .from("exam_sets")
            .upsert(
              {
                slug: `${departmentId.slice(0, 8)}-${topicSlug}`,
                title_en: topicName || "Untitled",
                department_id: departmentId,
                topic_id,
                mode,
                duration_minutes: 45,
                is_published: true,
                published_at: new Date().toISOString(),
                created_by_admin_id: admin.id,
              },
              { onConflict: "slug" },
            )
            .select("id")
            .single();
          topicExamSet = newEs;
        }

        if (topicExamSet) {
          const { count } = await supabase
            .from("exam_set_questions")
            .select("id", { count: "exact", head: true })
            .eq("exam_set_id", topicExamSet.id);

          await supabase.from("exam_set_questions").insert({
            exam_set_id: topicExamSet.id,
            question_id: question.id,
            sort_order: (count ?? 0) + 1,
          });
        }
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
