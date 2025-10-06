export function extractHashIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("id"); // Lấy giá trị param "id"
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}