const BASE_URL = "http://localhost:8000/api/ofac";

export async function searchSanctions(query) {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);

  if (!res.ok) {
    throw new Error("Search failed");
  }

  return res.json();
}
