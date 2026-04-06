import React from "react";
import { MD, iS } from "../config.js";

export default function NumberInput(props) {
  return React.createElement(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5, minWidth: 0, width: "100%" } },
    React.createElement("span", { style: { fontSize: 10, color: MD.muted, width: 42, flexShrink: 0 } }, props.label),
    React.createElement("input", {
      type: "number",
      min: props.min,
      max: props.max,
      step: props.step || 1,
      value: Math.round(props.value * 100) / 100,
      onFocus: props.onFocus,
      onChange: function (event) {
        props.onChange(+event.target.value);
      },
      style: Object.assign({}, iS, {
        flex: 1,
        minWidth: 0,
        width: 0,
        paddingRight: 8,
        appearance: "textfield",
        MozAppearance: "textfield",
        WebkitAppearance: "none",
        borderRadius: 12,
        lineHeight: 1.2
      }),
    }),
    props.unit && React.createElement("span", { style: { fontSize: 9, color: MD.muted, width: 18, flexShrink: 0, textAlign: "right" } }, props.unit)
  );
}
