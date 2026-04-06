import React from "react";
import { MD } from "../config.js";

export default function AssetTray(props) {
  return React.createElement(
    "div",
    {
      style: {
        height: 200,
        background: MD.surface,
        borderTop: "1px solid " + MD.line,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "0 -4px 16px rgba(15,23,42,.04)",
      },
    },
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px 10px", borderBottom: "1px solid " + MD.line } },
      React.createElement("div", { style: { fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 } }, "Asset Tray"),
      React.createElement("div", { style: { fontSize: 11, color: MD.muted } }, "썸네일 클릭 시 메인 비주얼 즉시 교체"),
      React.createElement("div", { style: { marginLeft: "auto", fontSize: 11, color: props.assetLoading ? MD.primary : MD.muted } }, props.assetLoading ? "불러오는 중..." : props.assetMessage)
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 14, padding: "14px 16px", minHeight: 0, flex: 1 } },
      React.createElement(
        "div",
        { style: { width: 260, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 } },
        React.createElement(
          "button",
          {
            onClick: function () {
              props.assetFileRef.current && props.assetFileRef.current.click();
            },
            style: {
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px dashed #333",
              background: "#111",
              color: "#aaa",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
            },
          },
          "+ 로컬 에셋 추가"
        ),
        React.createElement("input", {
          ref: props.assetFileRef,
          type: "file",
          accept: "image/*",
          multiple: true,
          onChange: function (event) {
            props.handleAssetFiles(event.target.files);
          },
          style: { display: "none" },
        }),
        React.createElement("textarea", {
          value: props.assetUrlInput,
          onChange: function (event) {
            props.setAssetUrlInput(event.target.value);
          },
          placeholder: "이미지 URL을 한 줄에 하나씩 붙여넣으세요",
          rows: 5,
          style: {
            background: "#111",
            border: "1px solid #222",
            borderRadius: 4,
            padding: "8px 10px",
            color: "#bbb",
            fontSize: 11,
            fontFamily: "'JetBrains Mono',monospace",
            resize: "none",
            width: "100%",
            boxSizing: "border-box",
          },
        }),
        React.createElement(
          "button",
          {
            onClick: props.importAssetUrls,
            disabled: props.assetLoading,
            style: {
              padding: "7px 10px",
              borderRadius: 4,
              border: "none",
              background: props.assetLoading ? "#222" : "linear-gradient(135deg,#00d4ff,#0099cc)",
              color: props.assetLoading ? "#555" : "#001018",
              cursor: props.assetLoading ? "default" : "pointer",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "inherit",
            },
          },
          "URL 에셋 불러오기"
        )
      ),
      React.createElement(
        "div",
        { style: { flex: 1, minWidth: 0, overflowX: "auto", overflowY: "hidden" } },
        props.assetLibrary.length === 0
          ? React.createElement(
              "div",
              {
                style: {
                  height: "100%",
                  minHeight: 110,
                  border: "1px dashed #222",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333",
                  fontSize: 12,
                  textAlign: "center",
                  padding: 20,
                },
              },
              "에셋을 추가하면 이곳에 썸네일이 쌓입니다."
            )
          : React.createElement(
              "div",
              { style: { display: "flex", gap: 10, height: "100%" } },
              props.assetLibrary.map(function (asset) {
                var isActive = props.imgLayer && props.imgLayer.src === asset.src;
                return React.createElement(
                  "div",
                  {
                    key: asset.id,
                    style: {
                      width: 144,
                      flexShrink: 0,
                      border: isActive ? "1px solid #00d4ff" : "1px solid #222",
                      borderRadius: 6,
                      background: isActive ? "rgba(0,212,255,.06)" : "#111",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    },
                  },
                  React.createElement(
                    "button",
                    {
                      onClick: function () {
                        props.applyAsset(asset);
                      },
                      style: { border: "none", padding: 0, background: "transparent", cursor: "pointer", textAlign: "left", color: "inherit" },
                    },
                    React.createElement("div", { style: { height: 96, background: "#0a0a0a" } }, React.createElement("img", { src: asset.src, alt: asset.name, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })),
                    React.createElement(
                      "div",
                      { style: { padding: "8px 9px 6px" } },
                      React.createElement("div", { style: { fontSize: 10, color: isActive ? "#00d4ff" : "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, asset.name),
                      React.createElement("div", { style: { fontSize: 9, color: "#555", marginTop: 3 } }, (asset.w || 0) + "×" + (asset.h || 0) + " · " + asset.origin)
                    )
                  ),
                  React.createElement(
                    "div",
                    { style: { display: "flex", gap: 6, padding: "0 9px 8px" } },
                    React.createElement(
                      "button",
                      {
                        onClick: function () {
                          props.applyAsset(asset);
                        },
                        style: {
                          flex: 1,
                          padding: "5px 0",
                          border: "none",
                          borderRadius: 4,
                          background: isActive ? "rgba(0,212,255,.12)" : "#171717",
                          color: isActive ? "#00d4ff" : "#999",
                          cursor: "pointer",
                          fontSize: 10,
                          fontFamily: "inherit",
                        },
                      },
                      isActive ? "적용됨" : "적용"
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: function () {
                          props.removeAsset(asset.id);
                        },
                        style: {
                          padding: "5px 8px",
                          border: "1px solid #2a1515",
                          borderRadius: 4,
                          background: "transparent",
                          color: "#a55",
                          cursor: "pointer",
                          fontSize: 10,
                          fontFamily: "inherit",
                        },
                      },
                      "삭제"
                    )
                  )
                );
              })
            )
      )
    )
  );
}
