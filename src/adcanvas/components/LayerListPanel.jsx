import React from "react";
import { MD, sT } from "../config.js";

export default function LayerListPanel(props) {
  var isDisabled = !!props.isDisabled;

  return React.createElement(
    "div",
    {
      style: {
        padding: 10,
        borderBottom: "1px solid #1a1a1a",
        opacity: isDisabled ? 0.42 : 1,
        filter: isDisabled ? "grayscale(.2)" : "none",
        transition: "opacity .16s ease, filter .16s ease",
      },
    },
    React.createElement("div", { style: sT }, "Layers"),
    isDisabled &&
      React.createElement(
        "div",
        {
          style: {
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 12,
            background: "rgba(255,255,255,.03)",
            border: "1px dashed " + MD.line,
            color: MD.muted,
            fontSize: 10,
            lineHeight: 1.5,
          },
        },
        "Select an artboard first to enable layer controls."
      ),
    props.layers.map(function (layer) {
      var boardLayer = props.activeBoard ? props.getLayerForBoard(props.activeBoard, layer) : layer;
      var isImage = layer.type === "image";
      var roleLabel = isImage ? "image" : "text";
      var layerName = props.getLayerDisplayName(boardLayer);
      var subLabel = isImage
        ? boardLayer.src
          ? boardLayer.imgW + "x" + boardLayer.imgH + " PNG"
          : "No image"
        : boardLayer.content;
      var isSelected = !isDisabled && props.selectedEls.indexOf(layer.id) !== -1;
      var layerHidden = props.activeBoard ? !!boardLayer.hidden : !boardLayer.visible;

      return React.createElement(
        "div",
        {
          key: layer.id,
          onClick: function (event) {
            if (isDisabled) return;
            props.onSelectLayer(layer, boardLayer, event.shiftKey);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 14,
            cursor: isDisabled ? "default" : "pointer",
            marginBottom: 4,
            background: isSelected ? MD.primarySoft : MD.surface2,
            border: isSelected ? "1px solid rgba(26,115,232,.18)" : "1px solid transparent",
            opacity: layerHidden ? 0.55 : 1,
          },
        },
        React.createElement("input", {
          type: "checkbox",
          checked: !layerHidden,
          disabled: isDisabled,
          onChange: function (event) {
            event.stopPropagation();
            if (isDisabled) return;
            props.onToggleVisibility(layer, layerHidden);
          },
          style: { accentColor: MD.primary },
        }),
        React.createElement(
          "div",
          {
            style: {
              width: 18,
              height: 18,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              flexShrink: 0,
              background: isImage ? "#e8f5e9" : "#eef3f8",
              border: "1px solid " + MD.line,
              color: isImage ? "#2e7d32" : boardLayer.color || MD.muted,
            },
          },
          isImage ? "I" : "T"
        ),
        React.createElement(
          "div",
          { style: { flex: 1, minWidth: 0 } },
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: MD.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              },
            },
            roleLabel
          ),
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", minWidth: 0 } },
            props.editingLayerNameId === layer.id && !isDisabled
              ? React.createElement("input", {
                  autoFocus: true,
                  value: props.layerNameDraft,
                  onChange: function (event) {
                    props.setLayerNameDraft(event.target.value);
                  },
                  onBlur: function () {
                    props.commitLayerNameEdit(layer.id);
                  },
                  onKeyDown: function (event) {
                    if (event.key === "Enter" || event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      props.commitLayerNameEdit(layer.id);
                    }
                  },
                  style: {
                    width: "100%",
                    minWidth: 0,
                    padding: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: MD.text,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  },
                })
              : React.createElement(
                  "div",
                  {
                    onDoubleClick: function (event) {
                      event.stopPropagation();
                      if (isDisabled) return;
                      props.setEditingLayerNameId(layer.id);
                      props.setLayerNameDraft(layerName);
                    },
                    style: {
                      flex: 1,
                      minWidth: 0,
                      fontSize: 12,
                      color: MD.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                    },
                  },
                  layerName
                )
          ),
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: MD.muted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
            subLabel
          )
        )
      );
    }),
    React.createElement(
      "div",
      {
        onClick: function () {
          if (isDisabled) return;
          props.fileRef.current && props.fileRef.current.click();
        },
        onDrop: function (event) {
          event.preventDefault();
          if (isDisabled) return;
          props.onUploadImageFile(event.dataTransfer.files && event.dataTransfer.files[0]);
        },
        onDragOver: function (event) {
          event.preventDefault();
        },
        style: {
          marginTop: 4,
          border: "1px dashed #333",
          borderRadius: 4,
          padding: props.imgLayer && props.imgLayer.src ? 4 : 12,
          cursor: isDisabled ? "default" : "pointer",
          textAlign: "center",
          background: "#0a0a0a",
          overflow: "hidden",
        },
      },
      props.imgLayer && props.imgLayer.src
        ? React.createElement(
            "div",
            { style: { position: "relative" } },
            React.createElement("img", {
              src: props.imgLayer.src,
              alt: "",
              style: {
                width: "100%",
                maxHeight: 80,
                objectFit: "contain",
                display: "block",
                background: "transparent",
              },
            }),
            React.createElement(
              "button",
              {
                disabled: isDisabled,
                onClick: function (event) {
                  event.stopPropagation();
                  if (isDisabled) return;
                  props.onRemoveImage();
                },
                style: {
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "rgba(0,0,0,.7)",
                  border: "none",
                  color: "#f44",
                  cursor: isDisabled ? "default" : "pointer",
                  borderRadius: 2,
                  padding: "0 3px",
                  fontSize: 9,
                },
              },
              "x"
            )
          )
        : React.createElement(
            "div",
            null,
            React.createElement("div", { style: { fontSize: 14 } }, "PNG"),
            React.createElement("div", { style: { color: "#444", fontSize: 9 } }, "Upload PNG")
          )
    ),
    React.createElement("input", {
      ref: props.fileRef,
      type: "file",
      accept: "image/png",
      onChange: function (event) {
        if (isDisabled) return;
        props.onUploadImageFile(event.target.files && event.target.files[0]);
      },
      style: { display: "none" },
    }),
    React.createElement(
      "button",
      {
        onClick: function () {
          if (isDisabled) return;
          props.onAddTextLayer();
        },
        disabled: isDisabled,
        style: {
          width: "100%",
          padding: "10px 12px",
          border: "1px dashed " + MD.line,
          borderRadius: 14,
          background: MD.surface,
          color: MD.muted,
          cursor: isDisabled ? "default" : "pointer",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "inherit",
          marginTop: 8,
        },
      },
      "+ Add text layer"
    )
  );
}
