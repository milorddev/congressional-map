// build-members.mjs  (Node 18+)
import fs from "fs";
import { DOMParser } from "@xmldom/xmldom";

// 1) Load GeoJSON (minified)
const geo = JSON.parse(fs.readFileSync("public/cd119.min.geo.json", "utf8"));

// 2) Load Clerk XML (local copy or fetch once)
let xmlText;
const xmlPath = "public/memberdata.xml";
if (fs.existsSync(xmlPath)) {
  xmlText = fs.readFileSync(xmlPath, "utf8");
} else {
  const res = await fetch("https://clerk.house.gov/xml/lists/MemberData.xml");
  if (!res.ok) throw new Error("Failed to fetch Clerk XML");
  xmlText = await res.text();
  fs.writeFileSync(xmlPath, xmlText);
}

// 3) Build statedistrict → {name, party, district}
const doc = new DOMParser().parseFromString(xmlText, "text/xml");
const bySD = {};
for (const m of Array.from(doc.getElementsByTagName("member"))) {
  const sd = m.getElementsByTagName("statedistrict")[0]?.textContent?.trim(); // e.g. "PA01","AK00"
  const name = m.getElementsByTagName("official-name")[0]?.textContent?.trim();
  const party = m.getElementsByTagName("party")[0]?.textContent?.trim();
  const district = m.getElementsByTagName("district")[0]?.textContent?.trim();
  if (!sd) continue;
  // Keep even if vacant so you can show “Vacant”
  bySD[sd] = {
    name: name || "Vacant",
    party: party || "Vacant",
    district: district || "",
  };
}

// 4) FIPS → postal
const F2P = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY","72":"PR"};

// 5) GEOID → member info
const byGEOID = {};
let matched = 0, total = 0;
for (const f of geo.features) {
  total++;
  const geoid = String(f.properties?.GEOID || "");
  if (geoid.length !== 4) continue;
  const fips = geoid.slice(0, 2);
  let dist = geoid.slice(2, 4);   // "01", "17", "98"
  if (dist === "98") dist = "00"; // at-large fix for PR/DC/territories
  const sdKey = `${F2P[fips]}${dist}`;
  const info = bySD[sdKey];
  if (info) {
    byGEOID[geoid] = info;
    matched++;
  }
}

fs.writeFileSync("public/members_by_geoid.json", JSON.stringify(byGEOID, null, 2));
console.log(`wrote public/members_by_geoid.json  matched=${matched}/${total}`);
