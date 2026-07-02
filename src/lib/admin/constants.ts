export type DeptSlug = "amt" | "pilot" | "cabin" | "mkt";

export interface DeptInfo {
  slug: DeptSlug;
  label: string;
  nameEn: string;
  dbSlug: string;
  dbDeptId: string;
}

export const DEPTS: Record<DeptSlug, DeptInfo> = {
  amt: {
    slug: "amt",
    label: "AMT",
    nameEn: "AMT Maintenance",
    dbSlug: "amt-maintenance",
    dbDeptId: "676ec20b-f7a6-470f-8f33-8c589740b148",
  },
  pilot: {
    slug: "pilot",
    label: "PILOT",
    nameEn: "Pilot",
    dbSlug: "pilot",
    dbDeptId: "20731ecd-b9c7-4d41-a5aa-f0e3d5663898",
  },
  cabin: {
    slug: "cabin",
    label: "CABIN",
    nameEn: "Cabin Crew",
    dbSlug: "cabin-crew",
    dbDeptId: "682b6f84-75f0-44f0-88a6-9e294506d546",
  },
  mkt: {
    slug: "mkt",
    label: "MKT",
    nameEn: "Marketing",
    dbSlug: "marketing",
    dbDeptId: "ffbd895c-de14-4320-87c2-c580efb12350",
  },
};

export const DEPT_SLUGS: DeptSlug[] = ["amt", "pilot", "cabin", "mkt"];

export function getDept(slug: string): DeptInfo | undefined {
  return DEPTS[slug as DeptSlug];
}

export function isValidDept(slug: string): slug is DeptSlug {
  return slug in DEPTS;
}
