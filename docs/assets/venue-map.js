// SVG venue maps that resemble the real-world layout.
// Two layouts are supported: stadium (oval) and arena (rectangular).

const ZONE_COLORS = [
  // first zone (closest to stage) → richest, last → softest
  "url(#grad-zone-0)",
  "url(#grad-zone-1)",
  "url(#grad-zone-2)",
  "url(#grad-zone-3)",
];

/**
 * Detect venue type from venue name (Thai or English).
 * @returns {"stadium"|"arena"}
 */
export function detectVenueType(venue) {
  const v = (venue || "").toLowerCase();
  if (/stadium|rajamangala|ราชมังคลา|ม\.ราม|outdoor|national|main stand/i.test(v))
    return "stadium";
  if (/arena|อารีน่า|อิมแพ็ค|impact|hall|theatre|theater/i.test(v))
    return "arena";
  // default — stadium feels grander, default to it
  return "stadium";
}

/**
 * Render a venue map SVG into a container.
 * @param {{ container: HTMLElement, venueType: string, zones: Array, activeZoneId?: string, onZoneClick: (zoneId: string) => void, formatPrice: (n: number) => string }} opts
 */
export function renderVenueMap({
  container,
  venueType,
  zones,
  activeZoneId,
  onZoneClick,
  formatPrice,
}) {
  const svg =
    venueType === "arena" ? renderArena(zones, activeZoneId) : renderStadium(zones, activeZoneId);
  const legend = renderLegend(zones, formatPrice);
  container.innerHTML = `
    <div class="venue-map-wrap">
      ${svg}
    </div>
    <div class="venue-legend">${legend}</div>
  `;
  container.querySelectorAll("[data-zone-region]").forEach((el) => {
    el.addEventListener("click", () => onZoneClick(el.dataset.zoneRegion));
  });
}

/* ---------- Stadium (Rajamangala) ----------
   Oval stadium with stage at the top.
   Zones wrap around in concentric horseshoe bands:
     zone 0 (VIP)        → "pit" right in front of stage
     zone 1 (Standard A) → middle band
     zone 2 (Standard B) → outer band
   Extra zones fall back to inner if not enough room.
----------------------------------------- */
function renderStadium(zones, activeZoneId) {
  const W = 600, H = 420;
  const cx = W / 2, cy = H * 0.62;
  // outer field outline
  const fieldRx = 260, fieldRy = 200;

  // zone bands: each band = outer arc from r1 to r2
  // Zones[0] = closest to stage (pit + side arcs in front)
  // Subsequent zones = bigger bands further from stage
  const bands = [];
  const maxZones = Math.min(zones.length, 3);
  const innermost = 80;
  const stepRx = (fieldRx - innermost) / maxZones;
  const stepRy = (fieldRy - 60) / maxZones;

  for (let i = 0; i < zones.length; i++) {
    const idx = Math.min(i, maxZones - 1);
    const r1x = innermost + idx * stepRx;
    const r1y = 60 + idx * stepRy;
    const r2x = innermost + (idx + 1) * stepRx;
    const r2y = 60 + (idx + 1) * stepRy;
    bands.push({ zone: zones[i], r1x, r1y, r2x, r2y, colorIdx: Math.min(i, ZONE_COLORS.length - 1) });
  }

  const stageHeight = 36;
  const stageY = cy - fieldRy - stageHeight - 14;

  const grads = renderGradients();

  // Build zone paths — horseshoe band from -160° to -20° wrapping below stage.
  // Each band is rendered as an annulus segment (outer ellipse arc + inner ellipse arc).
  const zonePaths = bands
    .map((band) => {
      const isActive = band.zone.id === activeZoneId;
      const dimmed = activeZoneId && !isActive ? "dimmed" : "";
      // Full annulus (closed horseshoe) — start angle from stage left to stage right going below
      const start = -170, end = -10; // degrees
      const path = bandPath(cx, cy, band.r1x, band.r1y, band.r2x, band.r2y, start, end);
      // Label position (mid-arc, between r1 and r2)
      const midAngle = (start + end) / 2;
      const labelR = ((band.r1x + band.r2x) / 2);
      const labelRy = ((band.r1y + band.r2y) / 2);
      const lx = cx + labelR * Math.cos(midAngle * Math.PI / 180);
      const ly = cy + labelRy * Math.sin(midAngle * Math.PI / 180);

      return `
        <path d="${path}"
          class="venue-zone ${dimmed}"
          fill="${ZONE_COLORS[band.colorIdx]}"
          stroke="rgba(255,255,255,0.08)"
          data-zone-region="${escapeAttr(band.zone.id)}" />
        <text x="${lx}" y="${ly}" class="venue-zone-label">${escapeText(band.zone.name)}</text>
      `;
    })
    .join("");

  return `
    <svg class="venue-map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grads}
      <!-- field background -->
      <ellipse cx="${cx}" cy="${cy}" rx="${fieldRx + 16}" ry="${fieldRy + 16}"
        fill="rgba(168,85,247,0.04)" stroke="rgba(168,85,247,0.18)" stroke-width="1" />
      <!-- inner field -->
      <ellipse cx="${cx}" cy="${cy}" rx="${innermost - 4}" ry="60"
        fill="rgba(7,6,12,0.6)" stroke="rgba(217,70,239,0.2)" stroke-width="1" />
      <text x="${cx}" y="${cy + 4}" class="venue-stage-label" style="font-size:10px; fill:var(--text-muted);">PITCH</text>

      ${zonePaths}

      <!-- stage at top -->
      <rect x="${cx - 110}" y="${stageY}" width="220" height="${stageHeight}"
        rx="6" class="venue-stage" />
      <text x="${cx}" y="${stageY + 23}" class="venue-stage-label">STAGE · เวที</text>

      <!-- compass: front/back labels -->
      <text x="${cx}" y="22" text-anchor="middle" style="font-size:10px; fill:var(--text-muted);">
        Stadium · view from above
      </text>
    </svg>
  `;
}

/* ---------- Arena (Impact) ----------
   Rectangular indoor arena, stage at one end.
   Zones are parallel bands stretching across the floor.
----------------------------------------- */
function renderArena(zones, activeZoneId) {
  const W = 600, H = 420;
  const pad = 30;
  const stageH = 44;
  const stageY = pad;

  const floorY = stageY + stageH + 14;
  const floorH = H - floorY - pad;
  const floorX = pad + 30;
  const floorW = W - 2 * (pad + 30);

  const grads = renderGradients();

  const zoneCount = zones.length;
  const bandH = floorH / Math.max(zoneCount, 1);
  // Front zone narrower (matches floor near stage)
  const taper = 36; // how much the front (top) of each band tapers in
  const zonePaths = zones
    .map((z, i) => {
      const top = floorY + i * bandH;
      const bot = top + bandH - 4;
      // Each band: trapezoid wider at the back so it looks like seating sloping up
      const inset = (taper * (zoneCount - i)) / zoneCount;
      const insetNext = (taper * (zoneCount - i - 1)) / zoneCount;
      const path = `M ${floorX + inset} ${top}
                    L ${floorX + floorW - inset} ${top}
                    L ${floorX + floorW - insetNext} ${bot}
                    L ${floorX + insetNext} ${bot} Z`;
      const colorIdx = Math.min(i, ZONE_COLORS.length - 1);
      const isActive = z.id === activeZoneId;
      const dimmed = activeZoneId && !isActive ? "dimmed" : "";
      const lx = floorX + floorW / 2;
      const ly = (top + bot) / 2 + 4;
      return `
        <path d="${path}"
          class="venue-zone ${dimmed}"
          fill="${ZONE_COLORS[colorIdx]}"
          stroke="rgba(255,255,255,0.08)"
          data-zone-region="${escapeAttr(z.id)}" />
        <text x="${lx}" y="${ly}" class="venue-zone-label">${escapeText(z.name)}</text>
      `;
    })
    .join("");

  return `
    <svg class="venue-map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grads}
      <!-- arena outline (rounded rect) -->
      <rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}"
        rx="22" fill="rgba(168,85,247,0.04)" stroke="rgba(168,85,247,0.18)" stroke-width="1" />

      <!-- stage -->
      <rect x="${W / 2 - 130}" y="${stageY}" width="260" height="${stageH}" rx="6"
        class="venue-stage" />
      <text x="${W / 2}" y="${stageY + stageH / 2 + 5}" class="venue-stage-label">STAGE · เวที</text>

      ${zonePaths}

      <text x="${W / 2}" y="${H - pad / 2}" text-anchor="middle"
        style="font-size:10px; fill:var(--text-muted);">
        Indoor Arena · view from above
      </text>
    </svg>
  `;
}

/* ---------- Shared helpers ---------- */
function renderGradients() {
  return `
    <defs>
      <linearGradient id="grad-zone-0" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f0abfc" />
        <stop offset="100%" stop-color="#d946ef" />
      </linearGradient>
      <linearGradient id="grad-zone-1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
      <linearGradient id="grad-zone-2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#818cf8" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="grad-zone-3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#67e8f9" />
        <stop offset="100%" stop-color="#22d3ee" />
      </linearGradient>
    </defs>
  `;
}

function renderLegend(zones, formatPrice) {
  return zones
    .map((z, i) => {
      const colorIdx = Math.min(i, ZONE_COLORS.length - 1);
      const gradStops = ["#d946ef", "#a855f7", "#6366f1", "#22d3ee"];
      return `
        <span class="pill">
          <span class="swatch" style="background: ${gradStops[colorIdx]}"></span>
          ${escapeText(z.name)} · ${escapeText(formatPrice(z.price))}
        </span>
      `;
    })
    .join("");
}

// Annulus segment between two ellipses (inner r1x/r1y → outer r2x/r2y)
// at angles in degrees (counter-clockwise from +x).
function bandPath(cx, cy, r1x, r1y, r2x, r2y, startDeg, endDeg) {
  const a1 = (startDeg * Math.PI) / 180;
  const a2 = (endDeg * Math.PI) / 180;
  const outerStart = { x: cx + r2x * Math.cos(a1), y: cy + r2y * Math.sin(a1) };
  const outerEnd   = { x: cx + r2x * Math.cos(a2), y: cy + r2y * Math.sin(a2) };
  const innerEnd   = { x: cx + r1x * Math.cos(a2), y: cy + r1y * Math.sin(a2) };
  const innerStart = { x: cx + r1x * Math.cos(a1), y: cy + r1y * Math.sin(a1) };
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  // sweep direction: outer arc CW (sweep=1), inner arc CCW (sweep=0)
  return `M ${outerStart.x} ${outerStart.y}
          A ${r2x} ${r2y} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${r1x} ${r1y} 0 ${large} 0 ${innerStart.x} ${innerStart.y}
          Z`.replace(/\s+/g, " ");
}

function escapeText(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
