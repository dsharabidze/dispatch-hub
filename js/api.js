/* 
   api.js — გარე API-ს ფენა
   იყენებს NHTSA vPIC-ს (უფასო, გასაღების გარეშე):
   მანქანის მარკები და მოდელები.
   https://vpic.nhtsa.dot.gov/api/
   */

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

/* აბრუნებს მსუბუქი ავტომობილის მარკების სიას (დასორტირებული).
   async/await + შეცდომის გადაგდება, რომ ზემოთ დავიჭიროთ. */


export async function fetchCarMakes() {
  const res = await fetch(`${BASE}/GetMakesForVehicleType/car?format=json`);
  if (!res.ok) throw new Error(`API დააბრუნა სტატუსი ${res.status}`);
  const data = await res.json();





  // უნიკალური სახელები (API ხანდახან იმეორებს) + ანბანურად

  const names = data.Results.map((r) => r.MakeName);
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b));
  return unique;
}



/* აბრუნებს მოდელებს არჩეული მარკისთვის */
export async function fetchModelsForMake(make) {
  const url = `${BASE}/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API დააბრუნა სტატუსი ${res.status}`);
  const data = await res.json();
  const models = data.Results.map((r) => r.Model_Name);
  return [...new Set(models)].sort((a, b) => a.localeCompare(b));
}
