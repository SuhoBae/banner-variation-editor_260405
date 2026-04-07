import React, { useEffect, useState } from "react";
import { MD, iS } from "../config.js";

export default function NumberInput(props) {
  function formatValue(value) {
    if (value == null || Number.isNaN(value)) return "";
    return String(Math.round(value * 100) / 100);
  }

  var _draft = useState(formatValue(props.value));
  var draft = _draft[0];
  var setDraft = _draft[1];
  var _focused = useState(false);
  var isFocused = _focused[0];
  var setIsFocused = _focused[1];

  useEffect(function () {
    if (!isFocused) setDraft(formatValue(props.value));
  }, [props.value, isFocused]);

  return React.createElement(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5, minWidth: 0, width: "100%" } },
    React.createElement("span", { style: { fontSize: 10, color: MD.muted, width: 42, flexShrink: 0 } }, props.label),
    React.createElement("input", {
      type: "number",
      min: props.min,
      max: props.max,
      step: props.step || 1,
      value: draft,
      onFocus: function (event) {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(event);
      },
      onChange: function (event) {
        var nextValue = event.target.value;
        setDraft(nextValue);
        if (nextValue === "" || nextValue === "-" || nextValue === "." || nextValue === "-.") return;
        var parsed = +nextValue;
        if (Number.isNaN(parsed)) return;
        props.onChange(parsed);
      },
      onBlur: function (event) {
        setIsFocused(false);
        var parsed = +draft;
        if (!Number.isNaN(parsed)) props.onChange(parsed);
        setDraft(formatValue(Number.isNaN(parsed) ? props.value : parsed));
        if (props.onBlur) props.onBlur(event);
      },
      onKeyDown: function (event) {
        if (event.key === "Enter") event.currentTarget.blur();
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
