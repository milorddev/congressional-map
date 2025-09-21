// main.js
import L from "leaflet";

const map = L.map("map").setView([39.5, -98.35], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);

const colorForParty = (p) => p === "R" ? "#c62033" : p === "D" ? "#2060ff" : "#8a8a8a";

const partyName = (p) => {
  if (p === "R") return "Republican";
  if (p === "D") return "Democrat";
  if (p === "I") return "Independent";
  if (p === "Vacant") return "Vacant";
  return p || "Unknown";
}

const searchGoogle = (name) => {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", name);
  return url.href;
}

(async function init() {
  const [geo, members] = await Promise.all([
    fetch("/cd119.min.geo.json").then(r=>r.json()),
    fetch("/members_by_geoid.json").then(r=>r.json())
  ]);

  const layer = L.geoJSON(geo, {
    style: f => {
      const info = members[f.properties.GEOID];
      return { color:"#000", weight:0.4, fillOpacity:0.7, fillColor: colorForParty(info?.party) };
    },
    onEachFeature: (f, layer) => {
      const info = members[f.properties.GEOID];
      if (info) {
        layer.bindPopup(`<a href="${searchGoogle(info.name)}" target="_blank" rel="noopener noreferrer"><b>${info.name}</b></a><br>District: ${info.district||""}<br>Party: ${partyName(info.party)}`);
      } else {
        layer.bindPopup(`${f.properties.NAMELSAD||""}<br>No member found`);
      }
    }
  }).addTo(map);

  map.fitBounds(layer.getBounds());
})();
