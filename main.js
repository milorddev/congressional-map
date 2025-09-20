import L from "leaflet";

// Map
const map = L.map("map").setView([39.5, -98.35], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// Colors
const colorForParty = (p) =>
  p === "R" ? "#c62033" : p === "D" ? "#2060ff" : "#aaaaaa";

// Postal ↔ FIPS lookup
const FIPS2POSTAL = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  10: "DE",
  11: "DC",
  12: "FL",
  13: "GA",
  15: "HI",
  16: "ID",
  17: "IL",
  18: "IN",
  19: "IA",
  20: "KS",
  21: "KY",
  22: "LA",
  23: "ME",
  24: "MD",
  25: "MA",
  26: "MI",
  27: "MN",
  28: "MS",
  29: "MO",
  30: "MT",
  31: "NE",
  32: "NV",
  33: "NH",
  34: "NJ",
  35: "NM",
  36: "NY",
  37: "NC",
  38: "ND",
  39: "OH",
  40: "OK",
  41: "OR",
  42: "PA",
  44: "RI",
  45: "SC",
  46: "SD",
  47: "TN",
  48: "TX",
  49: "UT",
  50: "VT",
  51: "VA",
  53: "WA",
  54: "WV",
  55: "WI",
  56: "WY",
  72: "PR",
};

(async function init() {
  const [partyBySD, geo] = await Promise.all([
    fetch("/party.json").then((r) => r.json()),
    fetch("/cb_2024_us_cd119_500k/cd119.geo.json").then((r) => r.json()),
  ]);

  // Build GEOID → info object
  const partyByGeoID = {};
  for (const f of geo.features) {
    const { STATEFP, CD119FP } = f.properties;
    const postal = FIPS2POSTAL[STATEFP];
    const key = `${postal}${CD119FP}`;
    if (partyBySD[key]) {
      partyByGeoID[f.properties.GEOID] = partyBySD[key]; // keep { name, party, district }
    }
  }

  const layer = L.geoJSON(geo, {
    style: (f) => {
      const info = partyByGeoID[f.properties.GEOID];
      const party = info ? info.party : null;
      return {
        color: "#000",
        weight: 0.4,
        fillOpacity: 0.7,
        fillColor: colorForParty(party),
      };
    },
    onEachFeature: (f, layer) => {
      const info = partyByGeoID[f.properties.GEOID];
      if (info) {
        layer.bindPopup(`
      <b>${info.name}</b><br/>
      ${f.properties.NAMELSAD}<br/>
      <span style="color:${colorForParty(info.party)}">${info.party}</span>
    `);
      } else {
        layer.bindPopup(`${f.properties.NAMELSAD}<br/>No member found`);
      }
    },
  }).addTo(map);

  map.fitBounds(layer.getBounds());
})();
