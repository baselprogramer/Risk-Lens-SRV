const BASE_URL = "https://api.risk-lens.net/api/ofac";

export async function searchSanctions(query) {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);

  if (!res.ok) {
    throw new Error("Search failed");
  }

  return res.json();
}
