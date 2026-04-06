import { BASE_W, ROLES } from "./config.js";

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function getSafe(sz) {
  var s = sz.safe;
  return s.pct
    ? { t: (sz.h * s.t) / 100, b: (sz.h * s.b) / 100, l: (sz.w * s.l) / 100, r: (sz.w * s.r) / 100 }
    : { t: s.t, b: s.b, l: s.l, r: s.r };
}

export function contrast(a, b) {
  function luminance(hex) {
    var rgb = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(function (chunk) {
      var value = parseInt(chunk, 16) / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  var l1 = luminance(a);
  var l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function scaleFS(base, tw, min) {
  return Math.max(min, Math.round((base * tw) / BASE_W));
}

export function computeLayout(w, h) {
  var ratio = w / h;
  if (ratio >= 2.5) {
    return {
      mode: "h",
      image: { x: 0, y: 0, w: 30, h: 100 },
      headline: { x: 33, y: 25, w: 40, h: 25 },
      subheadline: { x: 33, y: 55, w: 40, h: 20 },
      cta: { x: 75, y: 35, w: 20, h: 30 },
    };
  }
  if (ratio >= 1.25) {
    return {
      mode: "h",
      image: { x: 0, y: 0, w: 50, h: 100 },
      headline: { x: 55, y: 20, w: 40, h: 25 },
      subheadline: { x: 55, y: 50, w: 40, h: 15 },
      cta: { x: 55, y: 70, w: 40, h: 15 },
    };
  }
  return {
    mode: "v",
    image: { x: 0, y: 0, w: 100, h: 50 },
    headline: { x: 5, y: 58, w: 90, h: 12 },
    subheadline: { x: 5, y: 72, w: 90, h: 8 },
    cta: { x: 5, y: 83, w: 90, h: 12 },
  };
}

export function layoutRegion(layout, role) {
  if (role === "headline") return layout.headline;
  if (role === "subheadline") return layout.subheadline;
  if (role === "cta") return layout.cta;
  if (role === "legal") return { x: layout.cta.x, y: layout.cta.y + layout.cta.h + 1, w: layout.cta.w, h: 8 };
  return layout.headline;
}

export function getZoomStep(deltaY) {
  var magnitude = Math.min(Math.abs(deltaY), 160);
  var factor = Math.exp((-deltaY / 100) * 0.16 * (magnitude / 40));
  return clamp(factor, 0.72, 1.32);
}

export function measureTextBlock(text, fontSize, fontFamily, fontWeight, lineHeight, maxWidthPx) {
  var probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.left = "-99999px";
  probe.style.top = "0";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.boxSizing = "border-box";
  probe.style.whiteSpace = "pre-wrap";
  probe.style.wordBreak = "keep-all";
  probe.style.fontFamily = '"' + fontFamily + '","Noto Sans KR",sans-serif';
  probe.style.fontSize = fontSize + "px";
  probe.style.fontWeight = String(fontWeight);
  probe.style.lineHeight = String(lineHeight);
  if (maxWidthPx != null && isFinite(maxWidthPx)) {
    probe.style.width = Math.max(maxWidthPx, 1) + "px";
  }
  probe.textContent = text && text.length ? text : " ";
  document.body.appendChild(probe);
  var size = { width: Math.ceil(probe.scrollWidth), height: Math.ceil(probe.scrollHeight) };
  document.body.removeChild(probe);
  return size;
}

export function readEditableText(node) {
  if (!node) return "";

  function walk(current) {
    if (!current) return "";
    if (current.nodeType === 3) return current.nodeValue || "";
    if (current.nodeName === "BR") return "\n";

    var out = "";
    var children = Array.from(current.childNodes || []);
    children.forEach(function (child, index) {
      out += walk(child);
      if ((child.nodeName === "DIV" || child.nodeName === "P") && index < children.length - 1) {
        out += "\n";
      }
    });
    return out;
  }

  return walk(node).replace(/\u00A0/g, " ");
}

export function getLayerDisplayName(layer) {
  if (!layer) return "";
  if (layer.name) return layer.name;
  if (layer.type === "image") return layer.label || "이미지 영역";
  return (ROLES.find(function (role) { return role.key === layer.role; }) || {}).label || layer.role || "텍스트";
}
