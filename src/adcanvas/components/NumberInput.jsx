import React from "react";
import { MD, iS } from "../config.js";

export default function NumberInput(props) {
  return React.createElement(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 } },
    React.createElement("span", { style: { fontSize: 10, color: MD.muted, width: 48, flexShrink: 0 } }, props.label),
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
      style: Object.assign({}, iS, { flex: 1 }),
    }),
    props.unit && React.createElement("span", { style: { fontSize: 9, color: MD.muted, width: 16 } }, props.unit)
  );
}
