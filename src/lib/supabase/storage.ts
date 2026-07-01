export const QUESTION_IMAGES_BUCKET = "question-images";

export function getImagePublicUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${QUESTION_IMAGES_BUCKET}/${storagePath}`;
}
