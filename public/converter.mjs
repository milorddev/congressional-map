// build-party.mjs
import fs from "fs";
import { DOMParser } from "@xmldom/xmldom";

const xml = fs.readFileSync("memberdata.xml", "utf8");
const doc = new DOMParser().parseFromString(xml, "text/xml");
const members = doc.getElementsByTagName("member");
const out = {};
for (let i = 0; i < members.length; i++) {
  const m = members[i];
  const sd = m.getElementsByTagName("statedistrict")[0]?.textContent.trim(); // e.g. "PA01"
  const party = m.getElementsByTagName("party")[0]?.textContent.trim();
  const name = m.getElementsByTagName("official-name")[0]?.textContent.trim();
  const district = m.getElementsByTagName("district")[0]?.textContent.trim();
  if (sd && party && name) {
    out[sd] = {
      name,
      party,
      district,
    };
  }
}
fs.writeFileSync("party.json", JSON.stringify(out, null, 2));
console.log("✅ Wrote public/party.json with names + parties");
