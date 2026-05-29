// SVG venue maps inspired by ThaiTicketMajor layouts.
// Zones are colour-coded by PRICE TIER (highest price = brightest), with a
// price legend — the signature pattern of Thai ticketing seat maps.
// Supports two venue types: stadium (Rajamangala-style) and arena (Impact-style).

// Tier palette: index 0 = most expensive → brightest pink, descending to cyan.
const TIER_COLORS = [
  "#f0abfc", "#e879f9", "#d946ef", "#a855f7",
  "#7c3aed", "#6366f1", "#3b82f6", "#22d3ee",
];

export function detectVenueType(venue) {
  const v = (venue || "").toLowerCase();
  if (/arena|อารีน่า|อิมแพ็ค|impact|hall|theatre|theater|ธันเดอร์|thunder/i.test(v)) return "arena";
  if (/stadium|rajamangala|ราชมังคลา|ม\.ราม|national|กีฬา/i.test(v)) return "stadium";
  return "stadium";
}

// Map each zone to a tier index based on its price rank (desc).
function assignTiers(zones) {
  const prices = [...new Set(zones.map((z) => z.price))].sort((a, b) => b - a);
  const tierOf = new Map(prices.map((p, i) => [p, Math.min(i, TIER_COLORS.length - 1)]));
  return zones.map((z) => ({ ...z, tier: tierOf.get(z.price), color: TIER_COLORS[tierOf.get(z.price)] }));
}

export function renderVenueMap({ container, venueType, zones, activeZoneId, onZoneClick, formatPrice }) {
  const tz = assignTiers(zones);
  const svg = venueType === "arena" ? renderArena(tz, activeZoneId) : renderStadium(tz, activeZoneId);
  container.innerHTML = `
    <div class="venue-map-wrap">${svg}</div>
    <div class="venue-legend">${renderLegend(tz, formatPrice)}</div>
  `;
  container.querySelectorAll("[data-zone-region]").forEach((el) => {
    el.addEventListener("click", () => onZoneClick(el.dataset.zoneRegion));
  });
}

function renderLegend(zones, formatPrice) {
  return zones
    .slice()
    .sort((a, b) => b.price - a.price)
    .map((z) => `
      <span class="pill">
        <span class="swatch" style="background:${z.color}"></span>
        ${escapeText(z.name)}
        ${z.kind === "standing" ? '<span class="stand-tag">ยืน</span>' : ""}
        · ${escapeText(formatPrice(z.price))}
      </span>
    `).join("");
}

/* ============================================================
   STADIUM (Rajamangala-style)
   Stage top · standing zones in the PITCH · seated cats wrap as
   horseshoe bands (inner = premium).
   ============================================================ */
function renderStadium(zones, activeZoneId) {
  const W = 620, H = 460;
  const cx = W / 2, cy = H * 0.60;
  const standing = zones.filter((z) => z.kind === "standing");
  const seated = zones.filter((z) => z.kind !== "standing");

  const grads = gradients();
  const parts = [];

  // ----- seated horseshoe bands (outer rings) -----
  const fieldRx = 280, fieldRy = 210;
  const innerRx = 120, innerRy = 92;
  const nb = Math.max(seated.length, 1);
  const stepX = (fieldRx - innerRx) / nb;
  const stepY = (fieldRy - innerRy) / nb;
  // seated sorted premium (high price) innermost
  const seatedSorted = seated.slice().sort((a, b) => b.price - a.price);
  seatedSorted.forEach((z, i) => {
    const r1x = innerRx + i * stepX, r1y = innerRy + i * stepY;
    const r2x = innerRx + (i + 1) * stepX, r2y = innerRy + (i + 1) * stepY;
    const start = -168, end = -12;
    const path = bandPath(cx, cy, r1x, r1y, r2x, r2y, start, end);
    const dim = activeZoneId && z.id !== activeZoneId ? "dimmed" : "";
    const mid = (start + end) / 2;
    const lr = (r1x + r2x) / 2, lry = (r1y + r2y) / 2;
    const lx = cx + lr * Math.cos((mid * Math.PI) / 180);
    const ly = cy + lry * Math.sin((mid * Math.PI) / 180);
    parts.push(`<path d="${path}" class="venue-zone ${dim}" fill="${z.color}" fill-opacity="0.9"
      stroke="rgba(0,0,0,0.25)" data-zone-region="${escapeAttr(z.id)}"/>`);
    parts.push(`<text x="${lx}" y="${ly}" class="venue-zone-label">${escapeText(z.name)}</text>`);
  });

  // ----- standing zones in the pitch (stacked rectangles near stage) -----
  const standSorted = standing.slice().sort((a, b) => b.price - a.price);
  const pitchTop = cy - innerRy + 8;
  const pitchH = innerRy * 2 - 16;
  const slotH = pitchH / Math.max(standSorted.length, 1);
  standSorted.forEach((z, i) => {
    const y = pitchTop + i * slotH;
    const dim = activeZoneId && z.id !== activeZoneId ? "dimmed" : "";
    parts.push(`<rect x="${cx - 96}" y="${y + 3}" width="192" height="${slotH - 6}" rx="6"
      class="venue-zone ${dim}" fill="${z.color}" fill-opacity="0.92"
      stroke="rgba(0,0,0,0.25)" data-zone-region="${escapeAttr(z.id)}"/>`);
    parts.push(`<text x="${cx}" y="${y + slotH / 2 + 4}" class="venue-zone-label">${escapeText(z.name)} ⬤</text>`);
  });

  const stageY = cy - fieldRy - 50;
  return `
    <svg class="venue-map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grads}
      <ellipse cx="${cx}" cy="${cy}" rx="${fieldRx + 14}" ry="${fieldRy + 14}"
        fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.2)"/>
      ${parts.join("")}
      <rect x="${cx - 120}" y="${stageY}" width="240" height="38" rx="6" class="venue-stage"/>
      <text x="${cx}" y="${stageY + 24}" class="venue-stage-label">STAGE · เวที</text>
      <text x="${cx}" y="20" text-anchor="middle" style="font-size:10px;fill:#8b80a8;">Stadium · มุมมองด้านบน · ⬤ = โซนยืน</text>
    </svg>
  `;
}

/* ============================================================
   ARENA (Impact-style)
   Stage top · ARENA/VIP standing on the floor · STA/STB side
   strips · Level tiers as horizontal bands at the back.
   ============================================================ */
function renderArena(zones, activeZoneId) {
  const W = 620, H = 460, pad = 28;
  const grads = gradients();
  const parts = [];

  const stageY = pad, stageH = 42;
  const arenaTop = stageY + stageH + 12;
  const arenaBottom = H - pad - 8;
  const arenaH = arenaBottom - arenaTop;

  const isSide = (z) => /sta|stb|left|right|ซ้าย|ขวา/i.test(z.name);
  const sideZones = zones.filter(isSide);
  const standingFloor = zones.filter((z) => z.kind === "standing" && !isSide(z));
  const backTiers = zones.filter((z) => z.kind !== "standing" && !isSide(z));

  // side strips occupy left & right gutters
  const sideW = sideZones.length ? 78 : 0;
  const floorX = pad + sideW + (sideZones.length ? 10 : 60);
  const floorW = W - 2 * (pad + sideW) - (sideZones.length ? 20 : 120);

  // back tiers (trapezoid bands at the bottom = furthest from stage)
  const tierBandH = backTiers.length ? Math.min(56, arenaH * 0.5 / backTiers.length) : 0;
  const tiersTotalH = tierBandH * backTiers.length;
  const floorBottom = arenaBottom - tiersTotalH - (backTiers.length ? 8 : 0);

  // ---- standing floor (stacked, premium near stage) ----
  const floorSorted = standingFloor.slice().sort((a, b) => b.price - a.price);
  const floorAreaH = floorBottom - arenaTop;
  const fSlot = floorAreaH / Math.max(floorSorted.length, 1);
  floorSorted.forEach((z, i) => {
    const y = arenaTop + i * fSlot;
    const dim = activeZoneId && z.id !== activeZoneId ? "dimmed" : "";
    parts.push(`<rect x="${floorX}" y="${y + 3}" width="${floorW}" height="${fSlot - 6}" rx="6"
      class="venue-zone ${dim}" fill="${z.color}" fill-opacity="0.92"
      stroke="rgba(0,0,0,0.25)" data-zone-region="${escapeAttr(z.id)}"/>`);
    parts.push(`<text x="${floorX + floorW / 2}" y="${y + fSlot / 2 + 4}" class="venue-zone-label">${escapeText(z.name)} ⬤</text>`);
  });

  // ---- side strips ----
  const sideSorted = sideZones.slice();
  sideSorted.forEach((z, i) => {
    const left = i % 2 === 0;
    const x = left ? pad : W - pad - sideW;
    const dim = activeZoneId && z.id !== activeZoneId ? "dimmed" : "";
    parts.push(`<rect x="${x}" y="${arenaTop + 3}" width="${sideW}" height="${floorAreaH - 6}" rx="6"
      class="venue-zone ${dim}" fill="${z.color}" fill-opacity="0.92"
      stroke="rgba(0,0,0,0.25)" data-zone-region="${escapeAttr(z.id)}"/>`);
    parts.push(`<text x="${x + sideW / 2}" y="${arenaTop + floorAreaH / 2}" class="venue-zone-label" transform="rotate(-90 ${x + sideW / 2} ${arenaTop + floorAreaH / 2})">${escapeText(z.name)}</text>`);
  });

  // ---- back tiers ----
  const tiersSorted = backTiers.slice().sort((a, b) => b.price - a.price);
  tiersSorted.forEach((z, i) => {
    const top = floorBottom + 8 + i * tierBandH;
    const inset = 40 - i * (40 / Math.max(tiersSorted.length, 1));
    const insetNext = 40 - (i + 1) * (40 / Math.max(tiersSorted.length, 1));
    const x0 = pad, x1 = W - pad;
    const path = `M ${x0 + inset} ${top} L ${x1 - inset} ${top}
                  L ${x1 - insetNext} ${top + tierBandH - 4} L ${x0 + insetNext} ${top + tierBandH - 4} Z`;
    const dim = activeZoneId && z.id !== activeZoneId ? "dimmed" : "";
    parts.push(`<path d="${path.replace(/\s+/g, " ")}" class="venue-zone ${dim}" fill="${z.color}" fill-opacity="0.9"
      stroke="rgba(0,0,0,0.25)" data-zone-region="${escapeAttr(z.id)}"/>`);
    parts.push(`<text x="${W / 2}" y="${top + tierBandH / 2 + 2}" class="venue-zone-label">${escapeText(z.name)}</text>`);
  });

  return `
    <svg class="venue-map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grads}
      <rect x="${pad - 4}" y="${pad - 4}" width="${W - 2 * pad + 8}" height="${H - 2 * pad + 8}" rx="20"
        fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.2)"/>
      <rect x="${W / 2 - 130}" y="${stageY}" width="260" height="${stageH}" rx="6" class="venue-stage"/>
      <text x="${W / 2}" y="${stageY + stageH / 2 + 5}" class="venue-stage-label">STAGE · เวที</text>
      ${parts.join("")}
      <text x="${W / 2}" y="${H - 8}" text-anchor="middle" style="font-size:10px;fill:#8b80a8;">Indoor Arena · มุมมองด้านบน · ⬤ = โซนยืน</text>
    </svg>
  `;
}

/* ---------- helpers ---------- */
function gradients() {
  return `<defs>
    <filter id="zsh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>`;
}

function bandPath(cx, cy, r1x, r1y, r2x, r2y, startDeg, endDeg) {
  const a1 = (startDeg * Math.PI) / 180, a2 = (endDeg * Math.PI) / 180;
  const oS = { x: cx + r2x * Math.cos(a1), y: cy + r2y * Math.sin(a1) };
  const oE = { x: cx + r2x * Math.cos(a2), y: cy + r2y * Math.sin(a2) };
  const iE = { x: cx + r1x * Math.cos(a2), y: cy + r1y * Math.sin(a2) };
  const iS = { x: cx + r1x * Math.cos(a1), y: cy + r1y * Math.sin(a1) };
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${oS.x} ${oS.y} A ${r2x} ${r2y} 0 ${large} 1 ${oE.x} ${oE.y}
          L ${iE.x} ${iE.y} A ${r1x} ${r1y} 0 ${large} 0 ${iS.x} ${iS.y} Z`.replace(/\s+/g, " ");
}

function escapeText(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function escapeAttr(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
