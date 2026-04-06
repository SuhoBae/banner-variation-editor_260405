import React from "react";
import { MD, hSt } from "../config.js";

export default function ResizeHandles(props) {
  var sid = props.sid;
  var lid = props.lid;
  var beginDrag = props.beginDrag;
  var fitLayerToContent = props.fitLayerToContent;
  var handleStyle = { width: 4, height: 4, borderRadius: 1, background: MD.primary, border: "0.5px solid #fff" };

  function createHandle(mode, style) {
    return React.createElement("div", {
      onMouseDown: function (event) {
        beginDrag(event, sid, lid, mode);
      },
      onDoubleClick: function (event) {
        event.stopPropagation();
        event.preventDefault();
        fitLayerToContent(sid, lid);
      },
      style: Object.assign({}, hSt, handleStyle, style),
    });
  }

  return React.createElement(
    React.Fragment,
    null,
    createHandle("resize-se", { bottom: -2, right: -2, cursor: "nwse-resize" }),
    createHandle("resize-e", { top: "50%", right: -2, transform: "translateY(-50%)", cursor: "ew-resize" }),
    createHandle("resize-w", { top: "50%", left: -2, transform: "translateY(-50%)", cursor: "ew-resize" }),
    createHandle("resize-s", { left: "50%", bottom: -2, transform: "translateX(-50%)", cursor: "ns-resize" }),
    createHandle("resize-n", { left: "50%", top: -2, transform: "translateX(-50%)", cursor: "ns-resize" })
  );
}
