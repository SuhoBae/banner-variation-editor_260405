export const FONTS = [
  { family: "Pretendard", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Noto Sans KR", weights: [300, 400, 500, 700, 800, 900] },
  { family: "Nanum Gothic", weights: [400, 700, 800] },
  { family: "Noto Serif KR", weights: [300, 400, 500, 700, 900] },
  { family: "Black Han Sans", weights: [400] },
  { family: "Roboto", weights: [300, 400, 500, 700, 900] },
  { family: "Montserrat", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Playfair Display", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Oswald", weights: [300, 400, 500, 600, 700] },
];

export const PLATFORMS = {
  gdn: {
    name: "Google Display",
    icon: "GDN",
    sizes: [
      { id: "g1", w: 300, h: 250, label: "Medium Rect", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g2", w: 336, h: 280, label: "Large Rect", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g3", w: 728, h: 90, label: "Leaderboard", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g4", w: 320, h: 50, label: "Mobile Banner", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g5", w: 160, h: 600, label: "Skyscraper", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g6", w: 300, h: 600, label: "Half Page", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g7", w: 970, h: 250, label: "Billboard", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
      { id: "g8", w: 320, h: 100, label: "Large Mobile", safe: { t: 10, b: 10, l: 10, r: 10, pct: true } },
    ],
  },
  ig: {
    name: "Instagram",
    icon: "IG",
    sizes: [
      { id: "i1", w: 1080, h: 1080, label: "Feed 1:1", safe: { t: 0, b: 0, l: 0, r: 0, pct: false } },
      { id: "i2", w: 1080, h: 1350, label: "Feed 4:5", safe: { t: 0, b: 60, l: 0, r: 0, pct: false } },
      { id: "i3", w: 1080, h: 1920, label: "Story 9:16", safe: { t: 250, b: 280, l: 0, r: 0, pct: false } },
      { id: "i4", w: 1200, h: 628, label: "Wide 1.91:1", safe: { t: 0, b: 0, l: 60, r: 60, pct: false } },
    ],
  },
  yt: {
    name: "YouTube",
    icon: "YT",
    sizes: [
      { id: "y1", w: 1280, h: 720, label: "Thumbnail 16:9", safe: { t: 0, b: 70, l: 0, r: 120, pct: false } },
      { id: "y2", w: 2560, h: 1440, label: "Channel Banner", safe: { t: 155, b: 155, l: 424, r: 424, pct: false } },
    ],
  },
};

export const ALL_SIZES = Object.values(PLATFORMS).flatMap(function (platform) {
  return platform.sizes;
});

export const BASE_W = 1080;

export const ROLES = [
  { key: "headline", label: "Headline", min: 10 },
  { key: "subheadline", label: "Sub-headline", min: 8 },
  { key: "cta", label: "CTA Button", min: 10 },
  { key: "legal", label: "Legal", min: 7 },
];

export const MD = {
  bg: "#0b1017",
  surface: "#121821",
  surface2: "#18212c",
  surface3: "#1f2a36",
  line: "#2a3746",
  text: "#edf2f7",
  muted: "#94a3b8",
  primary: "#7cc4ff",
  primarySoft: "rgba(124,196,255,.14)",
  danger: "#ff7b72",
  dangerSoft: "rgba(255,123,114,.14)",
  shadow: "0 1px 2px rgba(0,0,0,.35), 0 12px 28px rgba(0,0,0,.28)",
};

export const iS = {
  background: MD.surface2,
  border: "1px solid " + MD.line,
  borderRadius: 12,
  padding: "8px 10px",
  color: MD.text,
  fontSize: 12,
  fontFamily: "Pretendard,'Noto Sans KR',Roboto,sans-serif",
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
};

export const sT = {
  fontSize: 11,
  color: MD.muted,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom: 10,
  fontWeight: 700,
};

export const hSt = {
  background: MD.primary,
  position: "absolute",
  zIndex: 30,
  boxShadow: "0 1px 3px rgba(26,115,232,.35)",
};
