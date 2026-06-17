const BASE_URL = ''; // შეცვალე შენი API-ს base URL-ით

export async function fetchData(endpoint) {
  // fetch, შეამოწმე response.ok, დააბრუნე response.json()
}

// localStorage-ის დამხმარე ფუნქციები — იმპორტი გაარ სადაც ჩანაწერები გჭირდება
export function getSaved() {
  const raw = localStorage.getItem('savedItems');
  return raw ? JSON.parse(raw) : [];
}

export function setSaved(items) {
  localStorage.setItem('savedItems', JSON.stringify(items));
}
