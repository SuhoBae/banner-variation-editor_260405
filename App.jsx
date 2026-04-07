import React, { useState, useRef, useEffect, useCallback } from "react";

import NumberInput from "./src/adcanvas/components/NumberInput.jsx";
import ResizeHandles from "./src/adcanvas/components/ResizeHandles.jsx";
import LayerListPanel from "./src/adcanvas/components/LayerListPanel.jsx";

var SNAPSHOT_STORAGE_KEY = "banner-variation-editor:snapshots";
var HISTORY_LIMIT = 50;

var FONTS = [
  {family:"Pretendard",weights:[300,400,500,600,700,800,900]},
  {family:"Noto Sans KR",weights:[300,400,500,700,800,900]},{family:"Nanum Gothic",weights:[400,700,800]},
  {family:"Noto Serif KR",weights:[300,400,500,700,900]},{family:"Black Han Sans",weights:[400]},
  {family:"Roboto",weights:[300,400,500,700,900]},{family:"Montserrat",weights:[300,400,500,600,700,800,900]},
  {family:"Playfair Display",weights:[400,500,600,700,800,900]},{family:"Oswald",weights:[300,400,500,600,700]},
];
var PLATFORMS = {
  gdn:{name:"Google Display",icon:"📐",sizes:[
    {id:"lge1",w:780,h:780,label:"LGE_heroBanner",safe:{t:0,b:0,l:0,r:0,pct:false}},
    {id:"g1",w:300,h:250,label:"Medium Rect",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g2",w:336,h:280,label:"Large Rect",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g3",w:728,h:90,label:"Leaderboard",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g4",w:320,h:50,label:"Mobile Banner",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g5",w:160,h:600,label:"Skyscraper",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g6",w:300,h:600,label:"Half Page",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g7",w:970,h:250,label:"Billboard",safe:{t:10,b:10,l:10,r:10,pct:true}},
    {id:"g8",w:320,h:100,label:"Lg Mobile",safe:{t:10,b:10,l:10,r:10,pct:true}},
  ]},
  ig:{name:"Instagram",icon:"📸",sizes:[
    {id:"i1",w:1080,h:1080,label:"피드 1:1",safe:{t:0,b:0,l:0,r:0,pct:false}},
    {id:"i2",w:1080,h:1350,label:"피드 4:5",safe:{t:0,b:60,l:0,r:0,pct:false}},
    {id:"i3",w:1080,h:1920,label:"스토리 9:16",safe:{t:250,b:280,l:0,r:0,pct:false}},
    {id:"i4",w:1200,h:628,label:"가로 1.91:1",safe:{t:0,b:0,l:60,r:60,pct:false}},
  ]},
  yt:{name:"YouTube",icon:"▶",sizes:[
    {id:"y1",w:1280,h:720,label:"썸네일 16:9",safe:{t:0,b:70,l:0,r:120,pct:false}},
    {id:"y2",w:2560,h:1440,label:"채널 배너",safe:{t:155,b:155,l:424,r:424,pct:false}},
  ]},
};
var ALL_SIZES=Object.values(PLATFORMS).flatMap(function(p){return p.sizes});
var BASE_W=1080;
var ROLES=[{key:"headline",label:"Headline",min:10},{key:"subheadline",label:"Sub-headline",min:8},{key:"cta",label:"CTA Button",min:10},{key:"legal",label:"법적 고지",min:7}];

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function getSafe(sz){var s=sz.safe;return s.pct?{t:sz.h*s.t/100,b:sz.h*s.b/100,l:sz.w*s.l/100,r:sz.w*s.r/100}:{t:s.t,b:s.b,l:s.l,r:s.r}}
function contrast(a,b){function l(h){var v=[h.slice(1,3),h.slice(3,5),h.slice(5,7)].map(function(c){var x=parseInt(c,16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]}var l1=l(a),l2=l(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
function scaleFS(base,tw,min){return Math.max(min,Math.round(base*tw/BASE_W))}

function computeLayout(w,h){
  var r=w/h;
  if(r>=2.5) return {mode:"h",image:{x:0,y:0,w:30,h:100},headline:{x:33,y:25,w:40,h:25},subheadline:{x:33,y:55,w:40,h:20},cta:{x:75,y:35,w:20,h:30}};
  if(r>=1.25) return {mode:"h",image:{x:0,y:0,w:50,h:100},headline:{x:55,y:20,w:40,h:25},subheadline:{x:55,y:50,w:40,h:15},cta:{x:55,y:70,w:40,h:15}};
  return {mode:"v",image:{x:0,y:0,w:100,h:50},headline:{x:5,y:58,w:90,h:12},subheadline:{x:5,y:72,w:90,h:8},cta:{x:5,y:83,w:90,h:12}};
}

function layoutRegion(lo,role){if(role==="headline")return lo.headline;if(role==="subheadline")return lo.subheadline;if(role==="cta")return lo.cta;if(role==="legal")return{x:lo.cta.x,y:lo.cta.y+lo.cta.h+1,w:lo.cta.w,h:8};return lo.headline}
var MD = {
  bg:"#0b1017",
  surface:"#121821",
  surface2:"#18212c",
  surface3:"#1f2a36",
  line:"#2a3746",
  text:"#edf2f7",
  muted:"#94a3b8",
  primary:"#7cc4ff",
  primarySoft:"rgba(124,196,255,.14)",
  danger:"#ff7b72",
  dangerSoft:"rgba(255,123,114,.14)",
  shadow:"0 1px 2px rgba(0,0,0,.35), 0 12px 28px rgba(0,0,0,.28)"
};
var iS={background:MD.surface2,border:"1px solid "+MD.line,borderRadius:12,padding:"8px 10px",color:MD.text,fontSize:12,fontFamily:"Pretendard,Roboto,'Noto Sans KR',sans-serif",width:"100%",boxSizing:"border-box",boxShadow:"inset 0 1px 0 rgba(255,255,255,.03)"};
var sT={fontSize:11,color:MD.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,fontWeight:700};
var hSt={background:MD.primary,position:"absolute",zIndex:30,boxShadow:"0 1px 3px rgba(26,115,232,.35)"};
var DEFAULT_LINE_HEIGHT = 1.4;
function trackingPercentToEm(percent){return clamp((+percent||0)/100,-0.3,0.3)}
function trackingEmToPercent(em){return Math.round(clamp(+em||0,-0.3,0.3)*100)}
function lineHeightPercentToValue(percent){return clamp((+percent||140)/100,0.8,3)}
function lineHeightValueToPercent(value){return Math.round(clamp(+value||DEFAULT_LINE_HEIGHT,0.8,3)*100)}
function getZoomStep(deltaY){
  var magnitude = Math.min(Math.abs(deltaY), 160);
  var factor = Math.exp((-deltaY / 100) * 0.16 * (magnitude / 40));
  return clamp(factor, .72, 1.32);
}
function measureTextBlock(text,fontSize,fontFamily,fontWeight,lineHeight,maxWidthPx){
  var probe=document.createElement("div");
  probe.style.position="absolute";
  probe.style.left="-99999px";
  probe.style.top="0";
  probe.style.visibility="hidden";
  probe.style.pointerEvents="none";
  probe.style.boxSizing="border-box";
  probe.style.whiteSpace="pre-wrap";
  probe.style.wordBreak="keep-all";
  probe.style.fontFamily='"'+fontFamily+'","Pretendard","Noto Sans KR",sans-serif';
  probe.style.fontSize=fontSize+"px";
  probe.style.fontWeight=String(fontWeight);
  probe.style.lineHeight=String(lineHeight);
  if(maxWidthPx!=null && isFinite(maxWidthPx)) probe.style.width=Math.max(maxWidthPx,1)+"px";
  probe.textContent=text&&text.length?text:" ";
  document.body.appendChild(probe);
  var size={width:Math.ceil(probe.scrollWidth),height:Math.ceil(probe.scrollHeight)};
  document.body.removeChild(probe);
  return size;
}
function getMeasurementText(text){
  var normalized = String(text || "");
  var trailingBreaks = normalized.match(/\n+$/);
  if(trailingBreaks && trailingBreaks[0].length){
    normalized += " ".repeat(trailingBreaks[0].length);
  }
  return normalized || " ";
}
function getAspectRatioLabel(w,h){
  var rw = Math.max(1, Math.round(w||1));
  var rh = Math.max(1, Math.round(h||1));
  function gcd(a,b){ return b ? gcd(b, a % b) : a; }
  var div = gcd(rw, rh);
  return Math.round(rw / div) + ":" + Math.round(rh / div);
}
function getAspectRatioParts(w,h){
  var rw = Math.max(1, Math.round(w||1));
  var rh = Math.max(1, Math.round(h||1));
  function gcd(a,b){ return b ? gcd(b, a % b) : a; }
  var div = gcd(rw, rh);
  return { w: Math.round(rw / div), h: Math.round(rh / div) };
}
function formatSnapshotDefaultName(date){
  var d = date || new Date();
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth()+1).padStart(2,"0");
  var dd = String(d.getDate()).padStart(2,"0");
  var hh = String(d.getHours()).padStart(2,"0");
  var mi = String(d.getMinutes()).padStart(2,"0");
  return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
}
function formatSnapshotSavedAt(value){
  if(!value) return "";
  var date = new Date(value);
  if(Number.isNaN(date.getTime())) return "";
  return formatSnapshotDefaultName(date);
}
function cloneHistoryState(state){
  return JSON.parse(JSON.stringify(state));
}
function serializeHistoryState(state){
  return JSON.stringify(state);
}
function getLayerDisplayName(layer){
  if(!layer) return "";
  if(layer.name) return layer.name;
  if(layer.type==="image") return layer.label || "이미지 영역";
  return (ROLES.find(function(r){return r.key===layer.role}) || {}).label || layer.role || "텍스트";
}

export default function App(){
  var fileRef=useRef(null),imgObjRef=useRef(null),dragRef=useRef(null),canvasRef=useRef(null),viewportRef=useRef(null),panRef=useRef(null),lastPointerRef=useRef(null),editingRef=useRef(null),editingDraftRef=useRef(""),isComposingRef=useRef(false);
  var _bg=useState("#0f0f0f");var bgColor=_bg[0],setBgColor=_bg[1];
  var _z=useState(1);var zoom=_z[0],setZoom=_z[1];
  var _pan=useState({x:0,y:0});var pan=_pan[0],setPan=_pan[1];
  var _ss=useState(false);var showSafe=_ss[0],setShowSafe=_ss[1];
  var _sg=useState(false);var showGrid=_sg[0],setShowGrid=_sg[1];
  var _clip=useState(false);var clipBoard=_clip[0],setClipBoard=_clip[1]; 
  var _sp=useState(false);var spaceHeld=_sp[0],setSpaceHeld=_sp[1];
  var _ip=useState(false);var isPanning=_ip[0],setIsPanning=_ip[1];
  var _ctx=useState(null);var ctxMenu=_ctx[0],setCtxMenu=_ctx[1]; 

  var _layers=useState([
    {id:"img1",type:"image",label:"메인 비주얼",name:"메인 비주얼",src:null,imgW:0,imgH:0,visible:true,zIndex:0},
    {id:"l1",type:"text",name:"메인 카피",role:"headline",content:"여름맞이 최대 50% 할인",font:"Noto Sans KR",size:48,weight:800,ls:-.02,lh:1.4,color:"#FFFFFF",align:"center",visible:true,zIndex:1},
    {id:"l2",type:"text",name:"보조 카피",role:"subheadline",content:"LG 베스트샵 전 제품",font:"Noto Sans KR",size:24,weight:500,ls:0,lh:1.4,color:"#CCCCCC",align:"center",visible:true,zIndex:2},
    {id:"l3",type:"text",name:"CTA 버튼",role:"cta",content:"자세히 보기",font:"Noto Sans KR",size:20,weight:700,ls:.02,lh:1.4,color:"#FFFFFF",align:"center",visible:true,bg:"#A50034",zIndex:3},
  ]);var layers=_layers[0],setLayers=_layers[1];
  
  var _ov=useState({});var overrides=_ov[0],setOverrides=_ov[1];
  var _bd=useState({});var boardDefaults=_bd[0],setBoardDefaults=_bd[1];
  var _bso=useState({});var boardSizeOverrides=_bso[0],setBoardSizeOverrides=_bso[1];
  
  var _cfnt=useState([]); var customFonts=_cfnt[0],setCustomFonts=_cfnt[1];
  var _cfntIn=useState(""); var customFontInput=_cfntIn[0],setCustomFontInput=_cfntIn[1];
  var _saved=useState([]); var savedProjects=_saved[0],setSavedProjects=_saved[1];
  var _saveName=useState(""); var saveNameDraft=_saveName[0],setSaveNameDraft=_saveName[1];
  var _saveMsg=useState("현재 작업 상태를 저장하고 다시 불러올 수 있습니다."); var saveMessage=_saveMsg[0],setSaveMessage=_saveMsg[1];
  var _saveBusy=useState(false); var saveBusy=_saveBusy[0],setSaveBusy=_saveBusy[1];
  
  var _sumId=useState(null); var summarizingId=_sumId[0], setSummarizingId=_sumId[1]; // 에이전트 요약 상태
  
  var histRef = useRef({ past: [], future: [] });
  var stateRef = useRef({ layers: layers, overrides: overrides, bgColor: bgColor, boardDefaults: boardDefaults, customFonts: customFonts, boardSizeOverrides: boardSizeOverrides });
  var lastHistorySerializedRef = useRef("");
  var _hc=useState(0); var setHistCount=_hc[1];
  
  useEffect(function() {
    stateRef.current = { layers: layers, overrides: overrides, bgColor: bgColor, boardDefaults: boardDefaults, customFonts: customFonts, boardSizeOverrides: boardSizeOverrides };
  }, [layers, overrides, bgColor, boardDefaults, customFonts, boardSizeOverrides]);

  var saveHistory = useCallback(function() {
    var serialized = serializeHistoryState(stateRef.current);
    var p = histRef.current.past;
    if(serialized !== lastHistorySerializedRef.current) {
      var st = JSON.parse(serialized);
      p.push(st);
      if(p.length > HISTORY_LIMIT) p.shift();
      histRef.current.future = [];
      lastHistorySerializedRef.current = serialized;
      setHistCount(function(c){return c+1});
    }
  }, []);

  var undo = useCallback(function() {
    var p = histRef.current.past;
    if (p.length === 0) return;
    var prev = p.pop();
    histRef.current.future.push(cloneHistoryState(stateRef.current));
    setLayers(prev.layers);
    setOverrides(prev.overrides);
    setBgColor(prev.bgColor);
    setBoardDefaults(prev.boardDefaults || {});
    setCustomFonts(prev.customFonts || []);
    setBoardSizeOverrides(prev.boardSizeOverrides || {});
    lastHistorySerializedRef.current = serializeHistoryState(prev);
    setHistCount(function(c){return c+1});
    setActiveEl(null); setSelectedEls([]);
    setCtxMenu(null);
  }, []);

  var redo = useCallback(function() {
    var f = histRef.current.future;
    if (f.length === 0) return;
    var next = f.pop();
    histRef.current.past.push(cloneHistoryState(stateRef.current));
    setLayers(next.layers);
    setOverrides(next.overrides);
    setBgColor(next.bgColor);
    setBoardDefaults(next.boardDefaults || {});
    setCustomFonts(next.customFonts || []);
    setBoardSizeOverrides(next.boardSizeOverrides || {});
    lastHistorySerializedRef.current = serializeHistoryState(next);
    setHistCount(function(c){return c+1});
    setActiveEl(null); setSelectedEls([]);
    setCtxMenu(null);
  }, []);

  useEffect(function(){
    try{
      var raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if(!raw) return;
      var parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) setSavedProjects(parsed);
    }catch(err){}
  },[]);

  function persistSavedProjects(nextList){
    setSavedProjects(nextList);
    try{
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(nextList));
    }catch(err){}
  }

  function buildProjectSnapshot(){
    return JSON.parse(JSON.stringify({
      layers: layers,
      overrides: overrides,
      bgColor: bgColor,
      boardDefaults: boardDefaults,
      customFonts: customFonts,
      boardSizeOverrides: boardSizeOverrides,
      selIds: selIds,
      customSizes: customSizes,
      showSafe: showSafe,
      showGrid: showGrid,
      clipBoard: clipBoard
    }));
  }

  function applyProjectSnapshot(snapshot){
    if(!snapshot) return;
    setLayers(snapshot.layers || []);
    setOverrides(snapshot.overrides || {});
    setBgColor(snapshot.bgColor || "#0f0f0f");
    setBoardDefaults(snapshot.boardDefaults || {});
    setCustomFonts(snapshot.customFonts || []);
    setBoardSizeOverrides(snapshot.boardSizeOverrides || {});
    setSelIds(snapshot.selIds || []);
    setCustomSizes(snapshot.customSizes || []);
    setShowSafe(!!snapshot.showSafe);
    setShowGrid(!!snapshot.showGrid);
    setClipBoard(!!snapshot.clipBoard);
    setActiveBoard(null);
    setActiveEl(null);
    setSelectedEls([]);
    setEditingTextId(null);
    setCtxMenu(null);
    histRef.current = { past: [], future: [] };
    lastHistorySerializedRef.current = serializeHistoryState(snapshot);
    setHistCount(function(c){return c+1});
  }

  var _sel=useState(["lge1"]);var selIds=_sel[0],setSelIds=_sel[1];
  var _cs=useState([]);var customSizes=_cs[0],setCustomSizes=_cs[1];
  var _cf=useState({name:"",w:"",h:"",st:"0",sb:"0",sl:"0",sr:"0"});var customForm=_cf[0],setCustomForm=_cf[1];
  var _scf=useState(false);var showCF=_scf[0],setShowCF=_scf[1];
  
  var _ab=useState(null);var activeBoard=_ab[0],setActiveBoard=_ab[1];
  var _selEls=useState([]);var selectedEls=_selEls[0],setSelectedEls=_selEls[1];
  var _ae=useState(null);var activeEl=_ae[0],setActiveEl=_ae[1];
  var _editing=useState(null);var editingTextId=_editing[0],setEditingTextId=_editing[1];
  var _edv=useState("");var editingDraftValue=_edv[0],setEditingDraftValue=_edv[1];
  var _eln=useState(null);var editingLayerNameId=_eln[0],setEditingLayerNameId=_eln[1];
  var _lnd=useState("");var layerNameDraft=_lnd[0],setLayerNameDraft=_lnd[1];
  var _ec=useState({});var exportChecked=_ec[0],setExportChecked=_ec[1];
  var _tk=useState(0);var setTick=_tk[1];

  useEffect(function(){
    if(!editingTextId || !editingRef.current) return;
    var baseLayer = layers.find(function(l){return l.id===editingTextId});
    var currentLayer = activeBoard && baseLayer ? getLayerForBoard(activeBoard, baseLayer) : baseLayer;
    var nextText = currentLayer && currentLayer.content != null ? String(currentLayer.content) : "";
    editingDraftRef.current = nextText;
    setEditingDraftValue(nextText);
    editingRef.current.value = nextText;
    var el = editingRef.current;
    el.focus();
    el.setSelectionRange(nextText.length,nextText.length);
    requestAnimationFrame(function(){ syncEditingTextarea(el); });
  }, [editingTextId, activeBoard, activeEl, layers, overrides, boardDefaults]);

  useEffect(function(){
    if(!activeBoard || !activeEl) return;
    function handlePointerDown(e){
      var canvasNode = canvasRef.current;
      if(canvasNode && !canvasNode.contains(e.target)) return;
      var activeLayerNode = document.getElementById("layer-"+activeBoard+"-"+activeEl);
      if(activeLayerNode && activeLayerNode.contains(e.target)) return;
      if(editingTextId) commitEditingText(activeBoard, activeEl, true);
      else {
        setEditingTextId(null);
        clearLayerSelection();
      }
    }
    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("touchstart", handlePointerDown, true);
    return function(){
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, [editingTextId, activeBoard, activeEl]);
  
  var allSizesBase=ALL_SIZES.concat(customSizes);
  function resolveBoardSize(size){
    if(!size) return null;
    var override = boardSizeOverrides[size.id];
    if(!override) return size;
    return Object.assign({}, size, {
      w: override.w != null ? override.w : size.w,
      h: override.h != null ? override.h : size.h
    });
  }
  function getSizeById(sid){
    return resolveBoardSize(allSizesBase.find(function(s){return s.id===sid}));
  }
  var allSizes=allSizesBase.map(resolveBoardSize);
  var visSizes=allSizes.filter(function(s){return selIds.indexOf(s.id)!==-1});
  var imgLayer=layers.find(function(l){return l.type==="image"});
  var activeBaseLayerObj=layers.find(function(l){return l.id===activeEl});
  var allFontsList = FONTS.concat(customFonts);

  useEffect(function(){
    var l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;800;900&family=Nanum+Gothic:wght@400;700;800&family=Noto+Serif+KR:wght@300;400;500;700;900&family=Black+Han+Sans&family=Roboto:wght@300;400;500;700;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";l.rel="stylesheet";document.head.appendChild(l);
    var pretendard=document.createElement("link");pretendard.href="https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/pretendard.css";pretendard.rel="stylesheet";document.head.appendChild(pretendard);
    var s=document.createElement("style");s.innerHTML=".ctx-item { padding: 8px 10px; font-size: 12px; color: "+MD.text+"; cursor: pointer; border-radius: 10px; transition: transform .08s ease, background-color .16s ease, color .16s ease, filter .16s ease; } .ctx-item:hover { background: "+MD.primarySoft+"; color: "+MD.primary+"; } .ctx-item:active { transform: translateY(1px) scale(.985); filter: brightness(.97); } .ctx-item.danger:hover { background: "+MD.dangerSoft+"; color: "+MD.danger+"; } .app-shell { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; } .app-shell button { transition: transform .08s ease, filter .16s ease, box-shadow .16s ease, background-color .16s ease, border-color .16s ease; -webkit-tap-highlight-color: transparent; } .app-shell button:not(:disabled):hover { filter: brightness(1.04); } .app-shell button:not(:disabled):active { transform: translateY(1px) scale(.985); filter: brightness(.96); } .app-shell input[type=number] { -webkit-appearance: none; appearance: textfield; } .app-shell input[type=number]::-webkit-outer-spin-button, .app-shell input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } .app-shell textarea::-webkit-scrollbar { width: 0; height: 0; display: none; }";document.head.appendChild(s);
  },[]);
  
  useEffect(function(){
    function kb(e){
      if(e.code==="Space"&&!e.repeat) {
        var activeNode = document.activeElement;
        var tag = activeNode ? activeNode.tagName : "";
        var isTypingTarget = !!(activeNode && (tag==="TEXTAREA" || tag==="INPUT" || activeNode.isContentEditable));
        if(!isTypingTarget) { e.preventDefault(); setSpaceHeld(true); }
      }
      if(e.key==="Escape"){
        if(editingTextId && activeBoard && activeEl){
          e.preventDefault();
          commitEditingText(activeBoard, activeEl, true);
          if(editingRef.current) editingRef.current.blur();
          return;
        }
        if(activeEl){
          e.preventDefault();
          setEditingTextId(null);
          clearLayerSelection();
          return;
        }
      }
      if((e.ctrlKey||e.metaKey)&&e.key==='z'){
        e.preventDefault();
        if(e.shiftKey) redo(); else undo();
      }
      if((e.ctrlKey||e.metaKey)&&e.key==='y'){
        e.preventDefault();
        redo();
      }
    }
    function ku(e){if(e.code==="Space"){setSpaceHeld(false);setIsPanning(false)}}
    function clickAway(){setCtxMenu(null)}
    window.addEventListener("keydown",kb);
    window.addEventListener("keyup",ku);
    window.addEventListener("click",clickAway);
    return function(){window.removeEventListener("keydown",kb);window.removeEventListener("keyup",ku);window.removeEventListener("click",clickAway);};
  },[undo, redo]);

  useEffect(function(){
    var el=canvasRef.current;if(!el)return;
    function onW(e){
      e.preventDefault();
      lastPointerRef.current = {x:e.clientX,y:e.clientY};
      var nextZoom = clamp(zoom * getZoomStep(e.deltaY),.1,5);
      zoomAtPoint(nextZoom, e.clientX, e.clientY);
    }
    function onMove(e){ lastPointerRef.current = {x:e.clientX,y:e.clientY}; }
    function onLeave(){ lastPointerRef.current = null; }
    el.addEventListener("wheel",onW,{passive:false});
    el.addEventListener("mousemove",onMove);
    el.addEventListener("mouseleave",onLeave);
    return function(){
      el.removeEventListener("wheel",onW);
      el.removeEventListener("mousemove",onMove);
      el.removeEventListener("mouseleave",onLeave);
    }
  },[zoom, pan.x, pan.y]);

  var setOv=useCallback(function(sid,lid,props){setOverrides(function(prev){var bo=prev[sid]||{};var lo=bo[lid]||{};var nb=Object.assign({},bo);nb[lid]=Object.assign({},lo,props);var n=Object.assign({},prev);n[sid]=nb;return n})},[]);
  function getOv(sid,lid){
    var def = boardDefaults[sid]?.[lid] || {};
    var ov = overrides[sid]?.[lid] || {};
    return Object.assign({}, def, ov);
  }
  function hasManualBoxOverride(sid,lid){
    return !!getOv(sid,lid).manualBox;
  }
  function getLayerForBoard(sid, layer){
    if(!layer) return null;
    return Object.assign({}, layer, getOv(sid, layer.id));
  }
  function activateLayerSelection(sid,lid,ids){
    var base = layers.find(function(l){return l.id===lid});
    var nextIds = ids || [lid];
    setActiveBoard(sid);
    setSelectedEls(nextIds);
    setActiveEl(lid);
    if(base && nextIds.length===1) syncEditingStateForLayer(getLayerForBoard(sid, base));
    else syncEditingStateForLayer(null);
  }
  function setBoardLayerProp(sid,lid,key,val){
    setOv(sid,lid,Object.assign({}, {[key]:val}));
  }
  function setBoardSizeProp(sid,key,val){
    var base = allSizesBase.find(function(size){return size.id===sid});
    if(!base) return;
    var nextValue = Math.round(clamp(+val || 0, 50, 4000));
    setBoardSizeOverrides(function(prev){
      var current = prev[sid] || {};
      var nextBoard = Object.assign({}, current, {[key]:nextValue});
      var resolvedW = nextBoard.w != null ? nextBoard.w : base.w;
      var resolvedH = nextBoard.h != null ? nextBoard.h : base.h;
      var next = Object.assign({}, prev);
      if(resolvedW === base.w && resolvedH === base.h) delete next[sid];
      else next[sid] = nextBoard;
      return next;
    });
  }
  function setBoardAspectParts(sid, ratioW, ratioH){
    var currentSize = getSizeById(sid);
    if(!currentSize) return;
    var nextRatioW = Math.round(clamp(+ratioW || 0, 1, 1000));
    var nextRatioH = Math.round(clamp(+ratioH || 0, 1, 1000));
    setBoardSizeProp(sid, "w", Math.round(currentSize.h * (nextRatioW / nextRatioH)));
  }
  function clearLayerSelection(){
    setActiveEl(null);
    setSelectedEls([]);
  }
  function syncEditingStateForLayer(layer){
    if(layer && layer.type==="text"){
      var nextText = String(layer.content || "");
      editingDraftRef.current = nextText;
      setEditingDraftValue(nextText);
      setEditingTextId(layer.id);
      return;
    }
    editingDraftRef.current = "";
    setEditingDraftValue("");
    setEditingTextId(null);
  }
  function commitLayerNameEdit(lid){
    if(!lid) return;
    var nextName = layerNameDraft.trim();
    var baseLayer = layers.find(function(layer){return layer.id===lid});
    var fallback = getLayerDisplayName(baseLayer);
    updateLayer(lid,"name",nextName || fallback);
    setEditingLayerNameId(null);
  }
  function commitEditingText(sid,lid,clearSelection){
    if(!sid || !lid) return;
    var nextText = editingDraftRef.current.replace(/\r/g,"");
    setBoardLayerProp(sid,lid,"content",nextText);
    setOv(sid,lid,{manualBox:false});
    setEditingTextId(null);
    setEditingDraftValue("");
    if(clearSelection) clearLayerSelection();
  }
  function handleLayerPanelSelect(layer, boardLayer, isShiftKey){
    if(isShiftKey){
      var alreadySelected = selectedEls.indexOf(layer.id) !== -1;
      var nextSelected = alreadySelected ? selectedEls.filter(function(id){return id!==layer.id}) : selectedEls.concat([layer.id]);
      setSelectedEls(nextSelected);
      setActiveEl(nextSelected.length ? nextSelected[nextSelected.length-1] : null);
      if(nextSelected.length===1) syncEditingStateForLayer(boardLayer);
      else syncEditingStateForLayer(null);
      return;
    }
    setSelectedEls([layer.id]);
    setActiveEl(layer.id);
    syncEditingStateForLayer(boardLayer);
  }
  function handleLayerPanelToggleVisibility(layer, layerHidden){
    saveHistory();
    if(activeBoard) setOv(activeBoard,layer.id,{hidden:layerHidden?false:true});
    else updateLayer(layer.id,"visible",!layer.visible);
  }
  function handleLayerPanelRemoveImage(){
    if(!imgLayer) return;
    saveHistory();
    setLayers(function(prev){
      return prev.map(function(layer){
        if(layer.type!=="image") return layer;
        return Object.assign({}, layer, { src:null, imgW:0, imgH:0 });
      });
    });
    imgObjRef.current = null;
  }
  function applyImageDataUrl(dataUrl){
    return new Promise(function(resolve,reject){
      var img = new Image();
      img.onload = function(){
        imgObjRef.current = img;
        setLayers(function(prev){
          return prev.map(function(layer){
            return layer.type==="image"
              ? Object.assign({}, layer, { src:dataUrl, imgW:img.naturalWidth, imgH:img.naturalHeight })
              : layer;
          });
        });
        resolve(img);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
  function handleAddTextLayer(){
    saveHistory();
    var id="l"+Date.now();
    setLayers(function(prev){
      return prev.concat([{
        id:id,
        type:"text",
        name:"새 텍스트 레이어",
        role:"headline",
        content:"새 텍스트",
        font:"Noto Sans KR",
        size:24,
        weight:700,
        ls:0,
        lh:DEFAULT_LINE_HEIGHT,
        color:"#FFFFFF",
        align:"center",
        visible:true,
        zIndex:prev.length
      }]);
    });
    if(activeBoard){
      setOverrides(function(prev){
        var next=Object.assign({},prev);
        allSizes.forEach(function(sz){
          if(sz.id!==activeBoard){
            var board=Object.assign({},next[sz.id]||{});
            board[id]=Object.assign({},board[id]||{},{hidden:true});
            next[sz.id]=board;
          }
        });
        return next;
      });
    }
    setActiveEl(id);
    setSelectedEls([id]);
  }
  function clearBoardLayerOverride(sid,lid){
    setOverrides(function(prev){
      var n=Object.assign({},prev);
      if(n[sid]){
        var b=Object.assign({},n[sid]);
        delete b[lid];
        if(Object.keys(b).length===0) delete n[sid];
        else n[sid]=b;
      }
      return n;
    });
  }
  function resetBoardState(sid){
    setBoardDefaults(function(prev){
      var n=Object.assign({},prev);
      delete n[sid];
      return n;
    });
    setBoardSizeOverrides(function(prev){
      var n=Object.assign({},prev);
      delete n[sid];
      return n;
    });
    setOverrides(function(prev){
      var n=Object.assign({},prev);
      delete n[sid];
      return n;
    });
  }
  function boardHasChanges(sid){
    if(boardSizeOverrides[sid]) return true;
    var board = overrides[sid];
    if(!board) return false;
    return Object.keys(board).some(function(lid){
      return Object.keys(board[lid] || {}).length > 0;
    });
  }
  function getZoomAnchor(){
    if(lastPointerRef.current) return lastPointerRef.current;
    var rect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    if(!rect) return {x:0,y:0};
    return {x: rect.left + (rect.width/2), y: rect.top + (rect.height/2)};
  }
  function zoomAtPoint(nextZoom, clientX, clientY){
    var rect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    if(!rect){
      setZoom(nextZoom);
      return;
    }
    var worldX = (clientX - rect.left - pan.x) / zoom;
    var worldY = (clientY - rect.top - pan.y) / zoom;
    setZoom(nextZoom);
    setPan({
      x: clientX - rect.left - (worldX * nextZoom),
      y: clientY - rect.top - (worldY * nextZoom)
    });
  }
  var activeLayerObj = activeBoard && activeBaseLayerObj ? getLayerForBoard(activeBoard, activeBaseLayerObj) : activeBaseLayerObj;
  function removeLayerFromBoard(sid,lid){
    setOv(sid,lid,{hidden:true});
    if(activeBoard===sid && activeEl===lid){
      setActiveEl(null);
      setSelectedEls([]);
      setEditingTextId(null);
    }
  }
  function fitLayerToContent(sid,lid){
    var baseLayer = layers.find(function(l){return l.id===lid});
    if(!baseLayer || baseLayer.type!=="text") return;
    saveHistory();
    var layer = getLayerForBoard(sid, baseLayer);
    var sz = getSizeById(sid);
    if(!sz) return;
    var er = getElRect(sid, layer);
    var nextW = er.w, nextH = er.h;
    if(layer.role==="cta" && layer.bg){
      var ctaMeasure = measureTextBlock(String(layer.content || ""), er.fs, layer.font, layer.weight, 1, null);
      var pH = er.fs * 0.3;
      var pV = er.fs * 0.2;
      nextW = ((ctaMeasure.width + pH * 2) / sz.w) * 100;
      nextH = ((ctaMeasure.height + pV * 2) / sz.h) * 100;
    } else {
      var textMeasure = measureTextBlock(String(layer.content || ""), er.fs, layer.font, layer.weight, layer.lh || DEFAULT_LINE_HEIGHT, null);
      nextW = (textMeasure.width / sz.w) * 100;
      nextH = (textMeasure.height / sz.h) * 100;
    }
    nextW = clamp(nextW, 2, 200);
    nextH = clamp(nextH, 2, 200);
    var nextX = er.x;
    if(layer.align==="center") nextX = er.x + ((er.w - nextW) / 2);
    if(layer.align==="right") nextX = er.x + (er.w - nextW);
    setOv(sid,lid,{x:nextX,w:nextW,h:nextH,manualBox:false});
  }
  
  function getElRect(sid,layer){
    var sz=getSizeById(sid);if(!sz)return{x:0,y:0,w:100,h:100,fs:12};
    var ov=getOv(sid,layer.id);
    var sa=getSafe(sz);
    var sw=sz.w-sa.l-sa.r, sh=sz.h-sa.t-sa.b;
    var lo=computeLayout(sw,sh);
    
    if(layer.type==="image"){
      var reg=lo.image;
      var regW_px = (reg.w/100)*sw;
      var regH_px = (reg.h/100)*sh;
      var size_px = Math.min(regW_px, regH_px);
      var cx_px = sa.l + (reg.x/100)*sw + regW_px/2;
      var cy_px = sa.t + (reg.y/100)*sh + regH_px/2;
      
      var defaultRw = (size_px / sz.w) * 100;
      var defaultRh = (size_px / sz.h) * 100;
      var defaultRx = (cx_px - size_px/2) / sz.w * 100;
      var defaultRy = (cy_px - size_px/2) / sz.h * 100;

      return {
        x: ov.x != null ? ov.x : defaultRx,
        y: ov.y != null ? ov.y : defaultRy,
        w: ov.w != null ? ov.w : defaultRw,
        h: ov.h != null ? ov.h : defaultRh
      };
    }
    
    var tReg=layoutRegion(lo,layer.role);
    var rm=ROLES.find(function(r){return r.key===layer.role});
    var fs=ov.fs!=null?ov.fs:scaleFS(layer.size,sw,rm?rm.min:8);
    var rx=(sa.l+(tReg.x/100)*sw)/sz.w*100;
    var ry=(sa.t+(tReg.y/100)*sh)/sz.h*100;
    var rw=(tReg.w/100)*sw/sz.w*100;
    var rh=(tReg.h/100)*sh/sz.h*100;
    if(layer.type==="text"){
      var layerLineHeight = layer.lh || DEFAULT_LINE_HEIGHT;
      var isEditingActive = editingTextId===layer.id && activeBoard===sid && activeEl===layer.id;
      var textContent = String((isEditingActive ? editingDraftValue : layer.content) || "");
      var measurementText = getMeasurementText(textContent);
      var manualBox = hasManualBoxOverride(sid,layer.id);
      var usesManualWidth = manualBox && ov.w!=null;
      var constrainedWidthPx = usesManualWidth ? (ov.w / 100) * sz.w : null;
      var measured = measureTextBlock(measurementText, fs, layer.font, layer.weight, layerLineHeight, layer.role==="cta" ? null : constrainedWidthPx);
      var intrinsicW = (measured.width / sz.w) * 100;
      var intrinsicH = (measured.height / sz.h) * 100;
      if(layer.role==="cta" && layer.bg){
        intrinsicW = ((measured.width + fs * 0.6) / sz.w) * 100;
        intrinsicH = ((measured.height + fs * 0.4) / sz.h) * 100;
      }
      var defaultW = clamp(intrinsicW, 2, 200);
      var defaultH = clamp(intrinsicH, 2, 200);
      var defaultX = rx;
      var defaultY = ry;
      var resolvedW = manualBox && ov.w != null ? ov.w : defaultW;
      var resolvedH = manualBox && ov.h != null ? Math.max(ov.h, defaultH) : defaultH;
      if(layer.align==="center") defaultX = rx + ((rw - resolvedW) / 2);
      if(layer.align==="right") defaultX = rx + (rw - resolvedW);
      if(layer.role==="cta") defaultY = ry + ((rh - defaultH) / 2);
      return {x:ov.x!=null?ov.x:defaultX,y:ov.y!=null?ov.y:defaultY,w:resolvedW,h:resolvedH,fs:fs};
    }
    return{x:ov.x!=null?ov.x:rx,y:ov.y!=null?ov.y:ry,w:ov.w!=null?ov.w:rw,h:ov.h!=null?ov.h:rh,fs:fs};
  }

  function alignSelected(type){
    if(!activeBoard || selectedEls.length===0) return;
    saveHistory();
    
    var sz=getSizeById(activeBoard); if(!sz) return;
    var sa=getSafe(sz);
    var sPx = (sa.l / sz.w) * 100;
    var sPy = (sa.t / sz.h) * 100;
    var sPw = ((sz.w - sa.l - sa.r) / sz.w) * 100;
    var sPh = ((sz.h - sa.t - sa.b) / sz.h) * 100;

    if(selectedEls.length === 1) {
      var rect = getElRect(activeBoard, activeLayerObj);
      var boardEl = document.querySelector('[data-bid="'+activeBoard+'"]');
      var myEl = document.getElementById("layer-"+activeBoard+"-"+activeEl);
      if(!boardEl || !myEl) return;
      var boardRect = boardEl.getBoundingClientRect();
      var r = myEl.getBoundingClientRect();
      var pw = (r.width / boardRect.width) * 100;
      var ph = (r.height / boardRect.height) * 100;
      var px = ((r.left - boardRect.left) / boardRect.width) * 100;
      var py = ((r.top - boardRect.top) / boardRect.height) * 100;

      var dx = 0, dy = 0;
      if(type === 'L') dx = sPx - px;
      if(type === 'C') dx = (sPx + sPw/2 - (pw / 2)) - px;
      if(type === 'R') dx = (sPx + sPw - pw) - px;
      if(type === 'T') dy = sPy - py;
      if(type === 'M') dy = (sPy + sPh/2 - (ph / 2)) - py;
      if(type === 'B') dy = (sPy + sPh - ph) - py;

      setOv(activeBoard, activeEl, {x: rect.x + dx, y: rect.y + dy});
    } else {
       var boardEl = document.querySelector('[data-bid="'+activeBoard+'"]');
       if(!boardEl) return;
       var boardRect = boardEl.getBoundingClientRect();
       var rects = selectedEls.map(function(id){
         var el = document.getElementById("layer-"+activeBoard+"-"+id);
         if(!el) return null;
         var r = el.getBoundingClientRect();
         return {
           id: id,
           px: ((r.left - boardRect.left) / boardRect.width) * 100,
           py: ((r.top - boardRect.top) / boardRect.height) * 100,
           pw: (r.width / boardRect.width) * 100,
           ph: (r.height / boardRect.height) * 100,
           stateRect: getElRect(activeBoard, layers.find(function(l){return l.id===id}))
         };
       }).filter(Boolean);

       if(rects.length === 0) return;
       var minX = Math.min.apply(null, rects.map(function(obj){return obj.px}));
       var maxX = Math.max.apply(null, rects.map(function(obj){return obj.px + obj.pw}));
       var minY = Math.min.apply(null, rects.map(function(obj){return obj.py}));
       var maxY = Math.max.apply(null, rects.map(function(obj){return obj.py + obj.ph}));

       rects.forEach(function(obj){
         var dx = 0, dy = 0;
         if(type==='L') dx = minX - obj.px;
         if(type==='C') dx = ((minX+maxX)/2 - (obj.pw/2)) - obj.px;
         if(type==='R') dx = (maxX - obj.pw) - obj.px;
         if(type==='T') dy = minY - obj.py;
         if(type==='M') dy = ((minY+maxY)/2 - (obj.ph/2)) - obj.py;
         if(type==='B') dy = (maxY - obj.ph) - obj.py;

         setOv(activeBoard, obj.id, {x: obj.stateRect.x + dx, y: obj.stateRect.y + dy});
       });
    }
  }

  useEffect(function(){
    function onMove(e){
      var p=panRef.current;if(p&&p.type==="pan"){e.preventDefault();setPan({x:p.sx+((e.clientX-p.mx)*(p.boost||1)),y:p.sy+((e.clientY-p.my)*(p.boost||1))});return}
      var d=dragRef.current;if(!d)return;e.preventDefault();
      var dx=e.clientX-d.mx,dy=e.clientY-d.my;
      var pxZ=(dx/(d.bw*zoom))*100,pyZ=(dy/(d.bh*zoom))*100;
      if(d.act==="move"){
        d.sps.forEach(function(obj){
          setOv(d.sid, obj.id, {x: clamp(obj.r.x+(pxZ*1.6),-50,150), y: clamp(obj.r.y+(pyZ*1.6),-50,150)});
        });
      }
      else{
        var sp = d.sps.find(function(s){return s.id===d.lid}).r;
        var dragBaseLayer = layers.find(function(l){return l.id===d.lid});
        var isTextLike = dragBaseLayer && dragBaseLayer.type==="text";
        var next = {x:sp.x,y:sp.y,w:sp.w,h:sp.h};
        var sz = getSizeById(d.sid);
        var resizeBoostX = pxZ * 1.8;
        var resizeBoostY = pyZ * 1.8;
        if(d.act==="resize-e" || d.act==="resize-se") next.w = clamp(sp.w + resizeBoostX, 5, 200);
        if(d.act==="resize-s" || d.act==="resize-se") next.h = clamp(sp.h + resizeBoostY, 3, 200);
        if(d.act==="resize-w"){
          next.x = clamp(sp.x + resizeBoostX, -50, 150);
          next.w = clamp(sp.w - resizeBoostX, 5, 200);
        }
        if(d.act==="resize-n"){
          next.y = clamp(sp.y + resizeBoostY, -50, 150);
          next.h = clamp(sp.h - resizeBoostY, 3, 200);
        }
        if(d.lid.startsWith("img")){
          var sizeFromW = next.w;
          if(d.act==="resize-n" || d.act==="resize-s") sizeFromW = next.h * (sz.h / sz.w);
          if(d.act==="resize-se") sizeFromW = Math.max(next.w, next.h * (sz.h / sz.w));
          sizeFromW = clamp(sizeFromW, 5, 200);
          next.w = sizeFromW;
          next.h = sizeFromW * (sz.w / sz.h);
          if(d.act==="resize-w") next.x = sp.x + (sp.w - next.w);
          if(d.act==="resize-n") next.y = sp.y + (sp.h - next.h);
        }
        if(isTextLike && (d.act==="resize-e" || d.act==="resize-w")){
          next.h = null;
        }
        if(isTextLike && d.act==="resize-se"){
          var scaleRatio = Math.max(next.w / Math.max(sp.w, 0.01), next.h / Math.max(sp.h, 0.01));
          next.fs = Math.round(clamp(sp.fs * scaleRatio, 6, 300));
          next.h = null;
        }
        if(!isTextLike && !d.lid.startsWith("img") && d.act==="resize-se"){
          var freeScaleRatio = Math.max(next.w / Math.max(sp.w, 0.01), next.h / Math.max(sp.h, 0.01));
          next.fs = Math.round(clamp(sp.fs * freeScaleRatio, 6, 300));
        }
        next.manualBox = true;
        setOv(d.sid, d.lid, next);
      }
      setTick(function(c){return c+1});
    }
    function onUp(){panRef.current=null;setIsPanning(false);if(dragRef.current){dragRef.current=null;document.body.style.cursor=""}setTick(function(c){return c+1})}
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return function(){window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp)};
  },[zoom,setOv]);

  function beginDrag(e,sid,lid,act){
    if(e.button !== 0 || spaceHeld) return; // 좌클릭이 아니거나 스페이스바 누른 상태면 캔버스 패닝으로 넘김
    e.stopPropagation();e.preventDefault();
    setEditingTextId(null);
    saveHistory(); 
    var el=e.target;while(el&&!el.getAttribute("data-bid"))el=el.parentElement;if(!el)return;
    var rect=el.getBoundingClientRect();
    
    var newSel = selectedEls.slice();
    if(act==="move") {
      if (e.shiftKey) {
        if(newSel.indexOf(lid) === -1) newSel.push(lid);
        else newSel = newSel.filter(function(x){return x!==lid});
      } else {
        if(newSel.indexOf(lid) === -1) newSel = [lid];
      }
    } else {
      newSel = [lid]; 
    }
    
    setSelectedEls(newSel); 
    setActiveEl(newSel.length > 0 ? newSel[newSel.length-1] : null); 
    setActiveBoard(sid);
    
    var sps = newSel.map(function(id){ return {id:id, r:Object.assign({}, getElRect(sid, layers.find(function(l){return l.id===id})))}; });
    dragRef.current={sid:sid,lid:lid,act:act,mx:e.clientX,my:e.clientY,bw:rect.width/zoom,bh:rect.height/zoom, sps:sps};
    document.body.style.cursor=act==="move"?"grabbing":(act==="resize-e"||act==="resize-w"?"ew-resize":act==="resize-n"||act==="resize-s"?"ns-resize":"nwse-resize");
  }

  function handleContextMenuLayer(e, sid, lid){
    if(spaceHeld) return;
    e.preventDefault(); e.stopPropagation();
    setEditingTextId(null);
    setActiveBoard(sid); setActiveEl(lid); setSelectedEls([lid]);
    setCtxMenu({x: e.clientX, y: e.clientY, sid: sid, lid: lid});
  }

  function handleContextMenuBoard(e, sid){
    if(spaceHeld) return;
    e.preventDefault(); e.stopPropagation();
    if(e.target.getAttribute("data-bid")===sid){
      setActiveBoard(sid); setActiveEl(null); setSelectedEls([]); setEditingTextId(null);
      setCtxMenu({x: e.clientX, y: e.clientY, sid: sid, lid: null});
    }
  }

  function startPan(e){
    var tag = e.target.tagName;
    if(tag==="INPUT" || tag==="TEXTAREA" || tag==="SELECT") return;
    var boardTarget = e.target.closest ? e.target.closest("[data-bid]") : null;
    if(e.button===0 && !spaceHeld && !boardTarget){
      setActiveBoard(null);
      setActiveEl(null);
      setSelectedEls([]);
      setEditingTextId(null);
      setCtxMenu(null);
      return;
    }
    // 휠클릭(1) 이거나, 스페이스바+좌클릭(0) 인 경우에만 패닝 시작
    if(e.button===1 || (e.button===0 && spaceHeld)){
      e.preventDefault();setIsPanning(true);panRef.current={type:"pan",mx:e.clientX,my:e.clientY,sx:pan.x,sy:pan.y,boost:1.22};
    }
  }
  function handleFile(file){
    if(!file)return;
    saveHistory();
    var reader=new FileReader();
    reader.onload=function(ev){
      applyImageDataUrl(ev.target.result).catch(function(){});
    };
    reader.readAsDataURL(file);
  }
  function getSnapshotResolvedSize(snapshot, size){
    if(!size) return null;
    var override = snapshot && snapshot.boardSizeOverrides ? snapshot.boardSizeOverrides[size.id] : null;
    if(!override) return size;
    return Object.assign({}, size, {
      w: override.w != null ? override.w : size.w,
      h: override.h != null ? override.h : size.h
    });
  }
  function getSnapshotSizeById(snapshot, sid){
    var baseSizes = ALL_SIZES.concat(snapshot.customSizes || []);
    var size = baseSizes.find(function(item){ return item.id===sid; });
    return getSnapshotResolvedSize(snapshot, size);
  }
  function getSnapshotOv(snapshot, sid, lid){
    var def = snapshot.boardDefaults && snapshot.boardDefaults[sid] ? snapshot.boardDefaults[sid][lid] || {} : {};
    var ov = snapshot.overrides && snapshot.overrides[sid] ? snapshot.overrides[sid][lid] || {} : {};
    return Object.assign({}, def, ov);
  }
  function getSnapshotLayerForBoard(snapshot, sid, layer){
    return Object.assign({}, layer, getSnapshotOv(snapshot, sid, layer.id));
  }
  function getSnapshotElRect(snapshot, sid, layer){
    var sz=getSnapshotSizeById(snapshot,sid);if(!sz)return{x:0,y:0,w:100,h:100,fs:12};
    var ov=getSnapshotOv(snapshot,sid,layer.id);
    var sa=getSafe(sz);
    var sw=sz.w-sa.l-sa.r, sh=sz.h-sa.t-sa.b;
    var lo=computeLayout(sw,sh);
    if(layer.type==="image"){
      var reg=lo.image;
      var regW_px=(reg.w/100)*sw;
      var regH_px=(reg.h/100)*sh;
      var size_px=Math.min(regW_px, regH_px);
      var cx_px=sa.l + (reg.x/100)*sw + regW_px/2;
      var cy_px=sa.t + (reg.y/100)*sh + regH_px/2;
      return {
        x: ov.x != null ? ov.x : (cx_px - size_px/2) / sz.w * 100,
        y: ov.y != null ? ov.y : (cy_px - size_px/2) / sz.h * 100,
        w: ov.w != null ? ov.w : (size_px / sz.w) * 100,
        h: ov.h != null ? ov.h : (size_px / sz.h) * 100
      };
    }
    var tReg=layoutRegion(lo,layer.role);
    var rm=ROLES.find(function(r){return r.key===layer.role});
    var fs=ov.fs!=null?ov.fs:scaleFS(layer.size,sw,rm?rm.min:8);
    var rx=(sa.l+(tReg.x/100)*sw)/sz.w*100;
    var ry=(sa.t+(tReg.y/100)*sh)/sz.h*100;
    var rw=(tReg.w/100)*sw/sz.w*100;
    var rh=(tReg.h/100)*sh/sz.h*100;
    if(layer.type==="text"){
      var textContent = String(layer.content || "");
      var measurementText = getMeasurementText(textContent);
      var manualBox = !!ov.manualBox;
      var usesManualWidth = manualBox && ov.w!=null;
      var constrainedWidthPx = usesManualWidth ? (ov.w / 100) * sz.w : null;
      var measured = measureTextBlock(measurementText, fs, layer.font, layer.weight, layer.lh, layer.role==="cta" ? null : constrainedWidthPx);
      var intrinsicW = (measured.width / sz.w) * 100;
      var intrinsicH = (measured.height / sz.h) * 100;
      if(layer.role==="cta" && layer.bg){
        intrinsicW = ((measured.width + fs * 0.6) / sz.w) * 100;
        intrinsicH = ((measured.height + fs * 0.4) / sz.h) * 100;
      }
      var defaultW = clamp(intrinsicW, 2, 200);
      var defaultH = clamp(intrinsicH, 2, 200);
      var defaultX = rx;
      var defaultY = ry;
      var resolvedW = manualBox && ov.w != null ? ov.w : defaultW;
      var resolvedH = manualBox && ov.h != null ? Math.max(ov.h, defaultH) : defaultH;
      if(layer.align==="center") defaultX = rx + ((rw - resolvedW) / 2);
      if(layer.align==="right") defaultX = rx + (rw - resolvedW);
      if(layer.role==="cta") defaultY = ry + ((rh - defaultH) / 2);
      return {x:ov.x!=null?ov.x:defaultX,y:ov.y!=null?ov.y:defaultY,w:resolvedW,h:resolvedH,fs:fs};
    }
    return{x:ov.x!=null?ov.x:rx,y:ov.y!=null?ov.y:ry,w:ov.w!=null?ov.w:rw,h:ov.h!=null?ov.h:rh,fs:fs};
  }
  function loadImageElement(src){
    return new Promise(function(resolve){
      if(!src) return resolve(null);
      var image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = function(){ resolve(image); };
      image.onerror = function(){ resolve(null); };
      image.src = src;
    });
  }
  function findSquareThumbnailBoard(snapshot){
    var selected = (snapshot.selIds || []).map(function(id){ return getSnapshotSizeById(snapshot, id); }).filter(Boolean);
    return selected.find(function(size){ return Math.abs(size.w - size.h) < 1; }) || null;
  }
  function renderSnapshotThumbnail(snapshot, sz){
    if(!snapshot || !sz) return Promise.resolve(null);
    return document.fonts.ready.then(function(){
      var scale = 240 / Math.max(sz.w, sz.h);
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sz.w * scale));
      canvas.height = Math.max(1, Math.round(sz.h * scale));
      var ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = snapshot.bgColor || "#0f0f0f";
      ctx.fillRect(0,0,sz.w,sz.h);
      var sorted = (snapshot.layers || []).slice().sort(function(a,b){ return a.zIndex-b.zIndex; });
      return Promise.all(sorted.map(function(baseLayer){
        var layer = getSnapshotLayerForBoard(snapshot, sz.id, baseLayer);
        if(!layer.visible || layer.hidden) return Promise.resolve();
        var er=getSnapshotElRect(snapshot,sz.id,layer);var dx=sz.w*er.x/100,dy=sz.h*er.y/100,dw=sz.w*er.w/100,dh=sz.h*er.h/100;
        if(layer.type==="image"){
          return loadImageElement(layer.src).then(function(image){
            if(!image) return;
            var ov = getSnapshotOv(snapshot, sz.id, layer.id);
            var imgS = ov.imgS != null ? ov.imgS : 1;
            var imgX = ov.imgX != null ? ov.imgX : 0;
            var imgY = ov.imgY != null ? ov.imgY : 0;
            var nw=image.naturalWidth,nh=image.naturalHeight;
            ctx.save();
            ctx.beginPath();
            ctx.rect(dx, dy, dw, dh);
            ctx.clip();
            var coverR = Math.max(dw/nw, dh/nh);
            var baseW = nw * coverR;
            var baseH = nh * coverR;
            var cx = dx + dw/2 + (dw * imgX / 100);
            var cy = dy + dh/2 + (dh * imgY / 100);
            var finalW = baseW * imgS;
            var finalH = baseH * imgS;
            ctx.drawImage(image, cx - finalW/2, cy - finalH/2, finalW, finalH);
            ctx.restore();
          });
        }
        if(layer.type==="text"){
          var fs=er.fs;if(fs<=0)return Promise.resolve();
          ctx.font=layer.weight+" "+fs+'px "'+layer.font+'","Noto Sans KR",sans-serif';
          var tx,ty=dy+dh/2;
          if(layer.align==="center"){ctx.textAlign="center";tx=dx+dw/2}else if(layer.align==="right"){ctx.textAlign="right";tx=dx+dw}else{ctx.textAlign="left";tx=dx}
          if(layer.role==="cta"&&layer.bg){
            var met=ctx.measureText(layer.content);var pH=fs*0.3,pV=fs*0.2;var bw=met.width+pH*2,bh=fs+pV*2;var bx=tx-bw/2,by=ty-bh/2;if(layer.align==="left")bx=tx;if(layer.align==="right")bx=tx-bw;ctx.fillStyle=layer.bg;ctx.beginPath();var rd=Math.min(fs*.2,bh/3);ctx.moveTo(bx+rd,by);ctx.lineTo(bx+bw-rd,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+rd);ctx.lineTo(bx+bw,by+bh-rd);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-rd,by+bh);ctx.lineTo(bx+rd,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-rd);ctx.lineTo(bx,by+rd);ctx.quadraticCurveTo(bx,by,bx+rd,by);ctx.closePath();ctx.fill();ctx.textBaseline="middle";ctx.fillStyle=layer.color;ctx.fillText(layer.content,tx,ty);
            return Promise.resolve();
          }
          ctx.textBaseline="top";ctx.fillStyle=layer.color;var lines=String(layer.content||"").split("\n");var lineH=fs*layer.lh;var startY=dy;lines.forEach(function(line,index){ctx.fillText(line,tx,startY+(index*lineH));});
        }
        return Promise.resolve();
      })).then(function(){
        try{return canvas.toDataURL("image/png")}catch(err){return null}
      });
    });
  }
  function pickColorWithEyedropper(onPick){
    if(typeof window === "undefined" || typeof window.EyeDropper !== "function") return;
    var eyeDropper = new window.EyeDropper();
    eyeDropper.open().then(function(result){
      if(result && result.sRGBHex && onPick) onPick(result.sRGBHex);
    }).catch(function(){});
  }
  async function handleSaveProjectSnapshot(){
    var snapshot = buildProjectSnapshot();
    var defaultName = formatSnapshotDefaultName(new Date());
    var finalName = (saveNameDraft || defaultName).trim() || defaultName;
    setSaveBusy(true);
    try{
      var squareBoard = findSquareThumbnailBoard(snapshot);
      var thumbnail = squareBoard ? await renderSnapshotThumbnail(snapshot, squareBoard) : null;
      var entry = {id:"snapshot-"+Date.now(),name:finalName,savedAt:new Date().toISOString(),thumbnail:thumbnail,thumbBoardId:squareBoard?squareBoard.id:null,thumbRatio:squareBoard?getAspectRatioLabel(squareBoard.w, squareBoard.h):null,snapshot:snapshot};
      var nextList = [entry].concat(savedProjects).slice(0, 30);
      persistSavedProjects(nextList);
      setSaveNameDraft("");
      setSaveMessage("작업 상태를 저장했습니다: " + finalName);
    }catch(err){
      setSaveMessage("저장 중 문제가 발생했습니다.");
    }finally{
      setSaveBusy(false);
    }
  }
  function handleLoadProjectSnapshot(entry){
    if(!entry || !entry.snapshot) return;
    var confirmed = window.confirm("현재 작업하던 캔버스 내 저장되지 않은 것들은 사라질 수 있습니다. 정말 불러오시겠습니까?");
    if(!confirmed) return;
    applyProjectSnapshot(entry.snapshot);
    setSaveMessage("저장본을 불러왔습니다: " + entry.name);
  }
  function handleDeleteProjectSnapshot(entryId){
    persistSavedProjects(savedProjects.filter(function(item){ return item.id !== entryId; }));
    setSaveMessage("저장본을 삭제했습니다.");
  }
  
  function handleAddCustomFont() {
    if(!customFontInput) return;
    var family = customFontInput.trim();
    if(allFontsList.find(function(f){return f.family===family})) {
      setCustomFontInput(""); return;
    }
    saveHistory();
    var link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=" + family.replace(/\s+/g, "+") + ":wght@300;400;500;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setCustomFonts(function(p){return p.concat([{family: family, weights: [300,400,500,700,900]}])});
    setCustomFontInput("");
  }

  // [에이전트 기반 자동 텍스트 요약 시뮬레이션]
  function runAgenticSummary(sid, lid, currentText) {
    if(!currentText || currentText.trim().length === 0) return;
    setSummarizingId(lid);
    
    // 에이전트 연동을 가정한 비동기 처리 딜레이 (1.5초)
    setTimeout(function() {
      saveHistory();
      var lines = currentText.split("\n");
      var summary = lines.map(function(l) {
        // 간단한 정규식으로 불필요한 수식어 컷팅 시뮬레이션
        return l.replace(/최대|전 제품|자세히 보기|지금 바로/g, "").trim().substring(0, 15);
      }).join("\n");
      
      if(summary.length > currentText.length) summary = currentText.substring(0, 8) + "..";
      if(summary === currentText) summary = summary + " (AI 요약됨)";
      
      setBoardLayerProp(sid, lid, "content", summary);
      setSummarizingId(null);
    }, 1500);
  }

  function renderExportCanvas(sz){return document.fonts.ready.then(function(){var c=document.createElement("canvas");c.width=sz.w;c.height=sz.h;var ctx=c.getContext("2d");ctx.fillStyle=bgColor;ctx.fillRect(0,0,sz.w,sz.h);var sorted=layers.slice().sort(function(a,b){return a.zIndex-b.zIndex});sorted.forEach(function(baseLayer){
    var layer = getLayerForBoard(sz.id, baseLayer);
    var isHidden = layer.hidden;
    if(!layer.visible || isHidden) return;
    var er=getElRect(sz.id,layer);var dx=sz.w*er.x/100,dy=sz.h*er.y/100,dw=sz.w*er.w/100,dh=sz.h*er.h/100;
    
    if(layer.type==="image"){
      if(imgObjRef.current&&layer.src){
        var nw=imgObjRef.current.naturalWidth,nh=imgObjRef.current.naturalHeight;
        var ov = getOv(sz.id, layer.id);
        var imgS = ov.imgS != null ? ov.imgS : 1;
        var imgX = ov.imgX != null ? ov.imgX : 0;
        var imgY = ov.imgY != null ? ov.imgY : 0;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, dw, dh);
        ctx.clip(); 

        var coverR = Math.max(dw/nw, dh/nh);
        var baseW = nw * coverR;
        var baseH = nh * coverR;

        var cx = dx + dw/2 + (dw * imgX / 100);
        var cy = dy + dh/2 + (dh * imgY / 100);

        var finalW = baseW * imgS;
        var finalH = baseH * imgS;

        ctx.drawImage(imgObjRef.current, cx - finalW/2, cy - finalH/2, finalW, finalH);
        ctx.restore();
      }else{
        ctx.fillStyle="rgba(255,255,255,0.03)";ctx.fillRect(dx,dy,dw,dh);ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.strokeRect(dx,dy,dw,dh);ctx.setLineDash([])
      }
    }else if(layer.type==="text"){
      var fs=er.fs;if(fs<=0)return;ctx.font=layer.weight+" "+fs+'px "'+layer.font+'","Pretendard","Noto Sans KR",sans-serif';var tx,ty=dy+dh/2;if(layer.align==="center"){ctx.textAlign="center";tx=dx+dw/2}else if(layer.align==="right"){ctx.textAlign="right";tx=dx+dw}else{ctx.textAlign="left";tx=dx}if(layer.role==="cta"&&layer.bg){var met=ctx.measureText(layer.content);var pH=fs*0.3,pV=fs*0.2;var bw=met.width+pH*2,bh=fs+pV*2;var bx=tx-bw/2,by=ty-bh/2;if(layer.align==="left")bx=tx;if(layer.align==="right")bx=tx-bw;ctx.fillStyle=layer.bg;ctx.beginPath();var rd=Math.min(fs*.2,bh/3);ctx.moveTo(bx+rd,by);ctx.lineTo(bx+bw-rd,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+rd);ctx.lineTo(bx+bw,by+bh-rd);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-rd,by+bh);ctx.lineTo(bx+rd,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-rd);ctx.lineTo(bx,by+rd);ctx.quadraticCurveTo(bx,by,bx+rd,by);ctx.closePath();ctx.fill();ctx.textBaseline="middle";ctx.fillStyle=layer.color;ctx.fillText(layer.content,tx,ty);}else{ctx.textBaseline="top";ctx.fillStyle=layer.color;var lines=layer.content.split("\n");var lineH=fs*(layer.lh || DEFAULT_LINE_HEIGHT);var startY=dy;for(var li=0;li<lines.length;li++){ctx.fillText(lines[li],tx,startY+(li*lineH));}}}});return c})}
  function exportOne(sz){return renderExportCanvas(sz).then(function(c){return new Promise(function(resolve){c.toBlob(function(blob){var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="App_"+sz.w+"x"+sz.h+"_"+sz.label.replace(/[\s/:]+/g,"_")+".png";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);resolve()},"image/png")})})}
  async function exportWithDirectoryPicker(list){
    var dirHandle = await window.showDirectoryPicker();
    for(var i=0;i<list.length;i++){
      var sz = list[i];
      var canvas = await renderExportCanvas(sz);
      var blob = await new Promise(function(resolve){ canvas.toBlob(resolve,"image/png"); });
      if(!blob) continue;
      var filename = "App_"+sz.w+"x"+sz.h+"_"+sz.label.replace(/[\s/:]+/g,"_")+".png";
      var fileHandle = await dirHandle.getFileHandle(filename,{create:true});
      var writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    }
  }
  
  function handleExport(){var list=visSizes.filter(function(s){return exportChecked[s.id]});if(list.length===0)return;if(typeof window !== "undefined" && typeof window.showDirectoryPicker==="function"){exportWithDirectoryPicker(list).catch(function(){var i=0;(function next(){if(i>=list.length)return;exportOne(list[i]).then(function(){i++;if(i<list.length)setTimeout(next,350)})})()});return;}var i=0;(function next(){if(i>=list.length)return;exportOne(list[i]).then(function(){i++;if(i<list.length)setTimeout(next,350)})})()}
  var exportCount=Object.keys(exportChecked).filter(function(k){return exportChecked[k]}).length;
  function updateLayer(id,k,v){setLayers(function(p){return p.map(function(l){if(l.id!==id)return l;var n=Object.assign({},l);n[k]=v;return n})})}
  function toggleSize(id){setSelIds(function(p){return p.indexOf(id)!==-1?p.filter(function(x){return x!==id}):p.concat([id])})}
  function addCustom(){if(!customForm.name||!customForm.w||!customForm.h)return;var id="c"+Date.now();setCustomSizes(function(p){return p.concat([{id:id,w:+customForm.w,h:+customForm.h,label:customForm.name,safe:{t:+customForm.st,b:+customForm.sb,l:+customForm.sl,r:+customForm.sr,pct:false}}])});setSelIds(function(p){return p.concat([id])});setCustomForm({name:"",w:"",h:"",st:"0",sb:"0",sl:"0",sr:"0"});setShowCF(false)}
  var crVal=activeLayerObj&&activeLayerObj.type==="text"?contrast(activeLayerObj.color,bgColor):0;
  var boardScale=.25;
  function syncEditingTextarea(node){
    if(!node) return;
    node.style.height = "0px";
    node.style.height = Math.max(node.scrollHeight, 1) + "px";
    node.scrollLeft = 0;
    node.scrollTop = 0;
  }

  function renderBoard(sz){
    var dw=sz.w*boardScale,dh=sz.h*boardScale;var sa=getSafe(sz);var isAct=activeBoard===sz.id;var isExp=!!exportChecked[sz.id];var lo=computeLayout(sz.w,sz.h);var mutated=boardHasChanges(sz.id);
    return React.createElement("div",{key:sz.id,style:{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0,verticalAlign:"top"}},
      React.createElement("label",{style:{display:"flex",alignItems:"center",gap:3,fontSize:9,cursor:"pointer",color:isExp?"#00d4ff":"#555",userSelect:"none"}},React.createElement("input",{type:"checkbox",checked:isExp,onChange:function(){setExportChecked(function(p){var n=Object.assign({},p);n[sz.id]=!p[sz.id];return n})},style:{accentColor:"#00d4ff"}}),"Export"),
      React.createElement("div",{"data-bid":sz.id,
        onMouseDown:function(e){if(e.button!==0 || spaceHeld)return; if(e.target.getAttribute("data-bid")===sz.id){setActiveBoard(sz.id);setActiveEl(null);setSelectedEls([]);setEditingTextId(null);}},
        onContextMenu:function(e){handleContextMenuBoard(e, sz.id)},
        style:{width:dw,height:dh,position:"relative",overflow:clipBoard?"hidden":"visible",borderRadius:2,border:"1px solid #333",background:bgColor,boxSizing:"border-box",boxShadow:isAct?"0 0 0 2px rgba(0,212,255,.92), 0 0 12px rgba(0,212,255,.15)":"none"}},
        layers.map(function(baseLayer){
          var layer = getLayerForBoard(sz.id, baseLayer);
          if(!layer.visible || layer.hidden) return null;
          var er=getElRect(sz.id,layer);var isSel=isAct&&selectedEls.indexOf(layer.id)!==-1;var labelFontSize=3;
          
          if(layer.type==="image"){
            var imgS = getOv(sz.id, layer.id).imgS ?? 1;
            var imgX = getOv(sz.id, layer.id).imgX ?? 0;
            var imgY = getOv(sz.id, layer.id).imgY ?? 0;
            
            return React.createElement("div",{key:layer.id,
              style:{position:"absolute",left:er.x+"%",top:er.y+"%",width:er.w+"%",height:er.h+"%",zIndex:isSel?15:layer.zIndex+2,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}, 
              React.createElement("div", {id: "layer-"+sz.id+"-"+layer.id, onClick:function(e){e.stopPropagation();activateLayerSelection(sz.id,layer.id,[layer.id]);}, onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")}, onContextMenu:function(e){handleContextMenuLayer(e, sz.id, layer.id)}, style:{position:"relative", display:"flex", width:"100%", height:"100%", maxWidth:"100%", maxHeight:"100%", border:isSel?"0.5px solid transparent":(layer.src?"0.5px solid transparent":"0.5px dashed rgba(255,255,255,0.15)"), boxShadow:isSel?"inset 0 0 0 1px rgba(124,196,255,.96), 0 0 0 1px rgba(124,196,255,0)":"none", background:layer.src?"transparent":"rgba(255,255,255,0.03)", pointerEvents:"auto", cursor:spaceHeld?"grab":"move", alignItems:"center", justifyContent:"center", flexDirection:"column", boxSizing:"border-box", overflow:"visible"}},
                layer.src ? React.createElement("div", {style:{width:"100%", height:"100%", overflow:"hidden", borderRadius:2}}, 
                              React.createElement("img",{src:layer.src,alt:"",draggable:false,style:{width:"100%",height:"100%",objectFit:"cover",transform:"translate("+imgX+"%,"+imgY+"%) scale("+imgS+")",pointerEvents:"none",display:"block"}})
                            )
                          : React.createElement(React.Fragment, null, 
                              null
                            ),
                isSel&&React.createElement(React.Fragment,null,
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",bottom:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,left:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,right:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                  React.createElement(ResizeHandles,{sid:sz.id,lid:layer.id,beginDrag:beginDrag,fitLayerToContent:fitLayerToContent,allowVertical:true}),
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-8,left:0,fontSize:labelFontSize,color:MD.primary,lineHeight:1,pointerEvents:"auto",whiteSpace:"nowrap",fontWeight:700,letterSpacing:".02em",cursor:spaceHeld?"grab":"move"}},getLayerDisplayName(layer)),
                  React.createElement("div",{onMouseDown:function(e){if(e.button!==0)return; e.stopPropagation();e.preventDefault();saveHistory();setOverrides(function(prev){var n=Object.assign({},prev);if(n[sz.id]){var b=Object.assign({},n[sz.id]);delete b[layer.id];n[sz.id]=b}return n})},style:Object.assign({},hSt,{top:-1.5,left:-1.5,cursor:"pointer",background:"#ff5a5a",fontSize:5.5,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",width:8,height:8,borderRadius:999,border:"0.5px solid #fff"})},"↺")
                )
              )
            );
          }
          var dfs=er.fs*boardScale;if(dfs<=0)return null;var isCta=layer.role==="cta"; 
          var textUsesManualBox = hasManualBoxOverride(sz.id, layer.id);
          var isEditingText = isSel && activeBoard===sz.id && activeEl===layer.id && editingTextId===layer.id;
          return React.createElement("div",{key:layer.id,
            style:{position:"absolute",left:er.x+"%",top:er.y+"%",width:er.w+"%",height:er.h+"%",display:"flex",alignItems:isCta?"center":"flex-start",justifyContent:layer.align==="center"?"center":layer.align==="right"?"flex-end":"flex-start",zIndex:isSel?15:layer.zIndex+2,userSelect:"none",pointerEvents:"none",overflow:"visible"}},
              React.createElement("div",{id: "layer-"+sz.id+"-"+layer.id, onClick:function(e){e.stopPropagation();activateLayerSelection(sz.id,layer.id,[layer.id]);}, onMouseDown:function(e){if(isEditingText){var editableNode=document.getElementById("layer-content-"+sz.id+"-"+layer.id);if(editableNode && editableNode.contains(e.target)) return;} if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")}, onContextMenu:function(e){handleContextMenuLayer(e, sz.id, layer.id)}, style:{position:"relative",display:"flex",width:"100%",height:"100%",maxWidth:"100%",maxHeight:"100%",border:isSel?"0.5px solid transparent":"0.5px solid transparent",boxShadow:isSel?"inset 0 0 0 1px rgba(124,196,255,.96), 0 0 0 1px rgba(124,196,255,0)":"none", pointerEvents:"auto", cursor:spaceHeld?"grab":"move", fontFamily:'"'+layer.font+'","Pretendard","Noto Sans KR",sans-serif',fontSize:dfs,fontWeight:layer.weight,letterSpacing:(layer.ls||0)+"em",lineHeight:layer.lh||DEFAULT_LINE_HEIGHT,color:layer.color,textAlign:layer.align,alignItems:isCta?"center":"flex-start",justifyContent:layer.align==="center"?"center":layer.align==="right"?"flex-end":"flex-start",boxSizing:"border-box",overflow:"visible"}},
              isSel && !isEditingText && React.createElement(React.Fragment,null,
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",bottom:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,left:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,right:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}})
              ),
              isSel && isEditingText && React.createElement(React.Fragment,null,
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",bottom:-2,left:-2,right:-2,height:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,left:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,right:-2,width:5,cursor:spaceHeld?"grab":"move",background:"transparent"}})
              ),
              isSel&&React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-8,left:0,fontSize:labelFontSize,color:MD.primary,lineHeight:1,pointerEvents:"auto",whiteSpace:"nowrap",fontWeight:700,letterSpacing:".02em",cursor:spaceHeld?"grab":"move"}},getLayerDisplayName(layer)),
              isEditingText
                ?React.createElement("textarea",{ref:editingRef,id:"layer-content-"+sz.id+"-"+layer.id,value:editingDraftValue,spellCheck:false,wrap:textUsesManualBox?"soft":"off",onClick:function(e){e.stopPropagation();},onMouseDown:function(e){e.stopPropagation();},onCompositionStart:function(){isComposingRef.current=true;},onCompositionEnd:function(e){isComposingRef.current=false;requestAnimationFrame(function(){syncEditingTextarea(e.target);setTick(function(c){return c+1});});},onChange:function(e){editingDraftRef.current=e.target.value;setEditingDraftValue(e.target.value);requestAnimationFrame(function(){syncEditingTextarea(e.target);setTick(function(c){return c+1});});},onBlur:function(){if(isComposingRef.current) return; commitEditingText(sz.id,layer.id,false);},onKeyDown:function(e){if(e.key==="Enter"){requestAnimationFrame(function(){syncEditingTextarea(e.currentTarget);setTick(function(c){return c+1});});} if(e.key==="Escape"){e.preventDefault();commitEditingText(sz.id,layer.id,true);e.currentTarget.blur();}},style:{position:"absolute",top:0,left:0,whiteSpace:textUsesManualBox?"pre-wrap":"pre",wordBreak:"keep-all",display:"block",width:"100%",minWidth:"100%",maxWidth:"100%",height:"100%",minHeight:"100%",padding:isCta?(dfs*0.2)+"px "+(dfs*0.3)+"px":0,margin:0,border:"none",background:isCta&&layer.bg?layer.bg:"transparent",borderRadius:isCta&&layer.bg?999:0,outline:"none",overflow:"hidden",resize:"none",cursor:"text",color:"inherit",font:"inherit",letterSpacing:"inherit",lineHeight:"inherit",textAlign:layer.align,boxSizing:"border-box",scrollbarWidth:"none",msOverflowStyle:"none",boxShadow:isCta&&layer.bg?"0 1px 3px rgba(0,0,0,.12)":"none"}}) 
                :isCta&&layer.bg
                  ?React.createElement("span",{id:"layer-content-"+sz.id+"-"+layer.id,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",boxSizing:"border-box",background:layer.bg,padding:(dfs*0.2)+"px "+(dfs*0.3)+"px",borderRadius:999,whiteSpace:textUsesManualBox?"pre-wrap":"pre",wordBreak:"keep-all",display:"flex",alignItems:"center",justifyContent:layer.align==="center"?"center":layer.align==="right"?"flex-end":"flex-start",textAlign:layer.align,lineHeight:layer.lh||DEFAULT_LINE_HEIGHT,boxShadow:"0 1px 3px rgba(0,0,0,.12)"}} ,layer.content)
                  :React.createElement("span",{id:"layer-content-"+sz.id+"-"+layer.id,style:{position:"absolute",top:0,left:0,whiteSpace:textUsesManualBox?"pre-wrap":"pre",wordBreak:"keep-all",display:"block",width:"100%",maxWidth:"100%",overflow:"visible",lineHeight:layer.lh||DEFAULT_LINE_HEIGHT,letterSpacing:(layer.ls||0)+"em"}},layer.content),
              isSel&&React.createElement(ResizeHandles,{sid:sz.id,lid:layer.id,beginDrag:beginDrag,fitLayerToContent:fitLayerToContent,allowVertical:true})
            )
          );
        }),
        showSafe&&(sa.t>0||sa.b>0||sa.l>0||sa.r>0)&&React.createElement(React.Fragment,null,
          sa.t>0&&React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,height:sa.t*boardScale,background:"rgba(255,40,40,.12)",borderBottom:"1px dashed rgba(255,80,80,.4)",pointerEvents:"none",zIndex:20}}),
          sa.b>0&&React.createElement("div",{style:{position:"absolute",bottom:0,left:0,right:0,height:sa.b*boardScale,background:"rgba(255,40,40,.12)",borderTop:"1px dashed rgba(255,80,80,.4)",pointerEvents:"none",zIndex:20}}),
          sa.l>0&&React.createElement("div",{style:{position:"absolute",top:0,left:0,bottom:0,width:sa.l*boardScale,background:"rgba(255,40,40,.12)",borderRight:"1px dashed rgba(255,80,80,.4)",pointerEvents:"none",zIndex:20}}),
          sa.r>0&&React.createElement("div",{style:{position:"absolute",top:0,right:0,bottom:0,width:sa.r*boardScale,background:"rgba(255,40,40,.12)",borderLeft:"1px dashed rgba(255,80,80,.4)",pointerEvents:"none",zIndex:20}})
        ),
        showGrid&&React.createElement("div",{style:{position:"absolute",inset:0,pointerEvents:"none",zIndex:19}},
          React.createElement("div",{style:{position:"absolute",top:"50%",left:0,right:0,borderTop:"1px dashed rgba(0,212,255,.14)"}}),
          React.createElement("div",{style:{position:"absolute",left:"50%",top:0,bottom:0,borderLeft:"1px dashed rgba(0,212,255,.14)"}})
        )
      ),
      React.createElement("div",{style:{fontSize:9,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",lineHeight:1.2}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,justifyContent:"center",flexWrap:"wrap"}},
          React.createElement("span",{style:{color:isAct?"#00d4ff":"#aaa",fontWeight:600}},sz.w+"×"+sz.h),
          mutated&&React.createElement("span",{style:{display:"inline-flex",alignItems:"center",padding:"1px 4px",borderRadius:999,fontSize:6.5,fontWeight:700,letterSpacing:".02em",background:MD.dangerSoft,color:MD.danger,border:"1px solid rgba(255,123,114,.24)"}},"변형됨"),
          mutated&&React.createElement("button",{onClick:function(e){e.stopPropagation();saveHistory();resetBoardState(sz.id);},style:{padding:"1px 5px",border:"1px solid rgba(124,196,255,.2)",borderRadius:999,fontSize:6.5,background:"rgba(124,196,255,.08)",color:MD.primary,cursor:"pointer",fontFamily:"inherit",fontWeight:700,lineHeight:1.3}},"초기화")
        ),
        React.createElement("div",{style:{fontSize:8,color:"#555"}},sz.label)
      )
    );
  }

return React.createElement("div",{className:"app-shell",style:{width:"100%",height:"100vh",maxHeight:"100vh",background:"linear-gradient(180deg,#0b1017 0%, #0f1720 100%)",color:MD.text,fontFamily:"Roboto,'Noto Sans KR',sans-serif",fontSize:12,display:"flex",flexDirection:"column",overflow:"hidden"}},

    /* HEADER */
    React.createElement("div",{
      style:{
        height:64,
        background:"rgba(11,16,23,.92)",
        backdropFilter:"blur(18px)",
        WebkitBackdropFilter:"blur(18px)",
        borderBottom:"1px solid "+MD.line,
        display:"flex",
        alignItems:"center",
        padding:"0 16px",
        gap:10,
        flexShrink:0,
        boxShadow:"0 1px 0 rgba(255,255,255,.02), 0 6px 18px rgba(0,0,0,.2)"
      }
    },
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
        React.createElement("div",{style:{width:28,height:28,borderRadius:10,background:"linear-gradient(135deg,#1a73e8,#34a853)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",boxShadow:"0 8px 16px rgba(26,115,232,.2)"}},"A"),
        React.createElement("div",null,
          React.createElement("div",{style:{fontWeight:700,fontSize:14,color:MD.text}},"Banner Variation Editor")
        )
      ),
      React.createElement("div",{style:{flex:1}}),
      
      /* History UI */
      React.createElement("button",{onClick:undo, disabled:histRef.current.past.length===0, style:{padding:"8px 12px",borderRadius:999,fontSize:11,border:"1px solid "+MD.line,cursor:histRef.current.past.length===0?"default":"pointer",fontFamily:"inherit",background:MD.surface,color:histRef.current.past.length===0?"#b0b8c5":MD.text,boxShadow:"0 1px 2px rgba(15,23,42,.04)"}}, "↩ Undo"),
      React.createElement("button",{onClick:redo, disabled:histRef.current.future.length===0, style:{padding:"8px 12px",borderRadius:999,fontSize:11,border:"1px solid "+MD.line,cursor:histRef.current.future.length===0?"default":"pointer",fontFamily:"inherit",background:MD.surface,color:histRef.current.future.length===0?"#b0b8c5":MD.text,boxShadow:"0 1px 2px rgba(15,23,42,.04)"}}, "↪ Redo"),
      React.createElement("div",{style:{width:1,height:20,background:MD.line}}),

      /* Zoom/Pan UI */
      React.createElement("button",{onClick:function(){var anchor=getZoomAnchor();zoomAtPoint(clamp(zoom-.15,.1,5),anchor.x,anchor.y)},style:{width:32,height:32,borderRadius:999,border:"1px solid "+MD.line,background:MD.surface,color:MD.text,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}},"-"),
      React.createElement("input",{type:"range",min:10,max:300,step:5,value:Math.round(zoom*100),onChange:function(e){var anchor=getZoomAnchor();zoomAtPoint(+e.target.value/100,anchor.x,anchor.y)},style:{width:120,accentColor:MD.primary}}),
      React.createElement("button",{onClick:function(){var anchor=getZoomAnchor();zoomAtPoint(clamp(zoom+.15,.1,5),anchor.x,anchor.y)},style:{width:32,height:32,borderRadius:999,border:"1px solid "+MD.line,background:MD.surface,color:MD.text,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}},"+"),
      React.createElement("span",{style:{fontSize:11,color:MD.muted,width:44,textAlign:"center",cursor:"pointer",userSelect:"none",fontWeight:600},onClick:function(){setZoom(1);setPan({x:0,y:0})}},Math.round(zoom*100)+"%"),
      React.createElement("button",{onClick:function(){setZoom(1);setPan({x:0,y:0})},style:{padding:"8px 10px",borderRadius:999,fontSize:10,border:"1px solid "+MD.line,cursor:"pointer",fontFamily:"inherit",background:MD.surface,color:MD.muted}},"100%"),
      React.createElement("button",{onClick:function(){var anchor=getZoomAnchor();zoomAtPoint(.5,anchor.x,anchor.y)},style:{padding:"8px 10px",borderRadius:999,fontSize:10,border:"1px solid "+MD.line,cursor:"pointer",fontFamily:"inherit",background:MD.surface,color:MD.muted}},"50%"),
      React.createElement("button",{onClick:function(){var anchor=getZoomAnchor();zoomAtPoint(.25,anchor.x,anchor.y)},style:{padding:"8px 10px",borderRadius:999,fontSize:10,border:"1px solid "+MD.line,cursor:"pointer",fontFamily:"inherit",background:MD.surface,color:MD.muted}},"25%"),

      React.createElement("div",{style:{width:1,height:20,background:MD.line}}),
      React.createElement("button",{onClick:function(){setClipBoard(!clipBoard)},style:{padding:"8px 12px",borderRadius:999,fontSize:11,border:"1px solid "+(clipBoard?MD.primary:MD.line),cursor:"pointer",fontFamily:"inherit",background:clipBoard?MD.primarySoft:MD.surface,color:clipBoard?MD.primary:MD.muted}}, clipBoard?"✂️ Clip":"👁 Overflow"),
      React.createElement("button",{onClick:function(){setShowSafe(!showSafe)},style:{padding:"8px 12px",borderRadius:999,fontSize:11,border:"1px solid "+(showSafe?MD.primary:MD.line),cursor:"pointer",fontFamily:"inherit",background:showSafe?MD.primarySoft:MD.surface,color:showSafe?MD.primary:MD.muted}},"🛡 Safe"),
      React.createElement("button",{onClick:function(){setShowGrid(!showGrid)},style:{padding:"8px 12px",borderRadius:999,fontSize:11,border:"1px solid "+(showGrid?MD.primary:MD.line),cursor:"pointer",fontFamily:"inherit",background:showGrid?MD.primarySoft:MD.surface,color:showGrid?MD.primary:MD.muted}},"📏 Grid"),
      React.createElement("div",{style:{width:1,height:20,background:MD.line}}),
      React.createElement("button",{onClick:function(){var a={};visSizes.forEach(function(s){a[s.id]=true});setExportChecked(a)},style:{padding:"8px 10px",borderRadius:999,fontSize:10,border:"1px solid "+MD.line,cursor:"pointer",fontFamily:"inherit",background:MD.surface,color:MD.muted}},"전체선택"),
      React.createElement("button",{onClick:function(){setExportChecked({})},style:{padding:"8px 10px",borderRadius:999,fontSize:10,border:"1px solid "+MD.line,cursor:"pointer",fontFamily:"inherit",background:MD.surface,color:MD.muted}},"해제"),
      React.createElement("button",{onClick:handleExport,disabled:exportCount===0,style:{padding:"9px 16px",borderRadius:999,fontSize:11,border:"none",fontFamily:"inherit",fontWeight:700,cursor:exportCount?"pointer":"default",background:exportCount?MD.primary:"#dfe4ec",color:exportCount?"#fff":"#93a0b3",boxShadow:exportCount?"0 8px 16px rgba(26,115,232,.2)":"none"}},"⬇ Export"+(exportCount?" ("+exportCount+")":""))
    ),

    React.createElement("div",{style:{display:"flex",flex:1,overflow:"hidden",minHeight:0}},

      /* LEFT */
      React.createElement("div",{style:{width:260,background:MD.surface,borderRight:"1px solid "+MD.line,overflowY:"auto",flexShrink:0,boxShadow:"inset -1px 0 0 rgba(255,255,255,.03)"}},
        React.createElement(LayerListPanel,{
          layers:layers,
          activeBoard:activeBoard,
          isDisabled:!activeBoard,
          getLayerForBoard:getLayerForBoard,
          selectedEls:selectedEls,
          getLayerDisplayName:getLayerDisplayName,
          onSelectLayer:handleLayerPanelSelect,
          onToggleVisibility:handleLayerPanelToggleVisibility,
          editingLayerNameId:editingLayerNameId,
          layerNameDraft:layerNameDraft,
          setEditingLayerNameId:setEditingLayerNameId,
          setLayerNameDraft:setLayerNameDraft,
          commitLayerNameEdit:commitLayerNameEdit,
          fileRef:fileRef,
          imgLayer:imgLayer,
          onUploadImageFile:handleFile,
          onRemoveImage:handleLayerPanelRemoveImage,
          imageStatusText:"PNG를 업로드하거나 드래그해서 현재 이미지 레이어에 적용합니다.",
          onAddTextLayer:handleAddTextLayer,
          onDeleteLayer:function(layerId){
            if(!activeBoard || !layerId) return;
            saveHistory();
            removeLayerFromBoard(activeBoard, layerId);
          }
        }),
        React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
          React.createElement("div",{style:sT},"🎨 캔버스 배경"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4}},React.createElement("input",{type:"color",value:bgColor,onMouseDown:saveHistory,onChange:function(e){setBgColor(e.target.value)},style:{width:24,height:24,border:"none",borderRadius:3,cursor:"pointer",background:"none",padding:0}}),React.createElement("input",{type:"text",value:bgColor,onFocus:saveHistory,onChange:function(e){setBgColor(e.target.value)},style:Object.assign({},iS,{flex:1})})),
          React.createElement("div",{style:{display:"flex",gap:3,marginBottom:6}},["#0f0f0f","#1a1a2e","#A50034","#FFFFFF","#f5f5f5","#0d1b2a","#2d1b69","#1b3a2d"].map(function(c){return React.createElement("div",{key:c,onClick:function(){saveHistory();setBgColor(c)},style:{width:18,height:18,borderRadius:3,background:c,cursor:"pointer",border:bgColor===c?"2px solid #00d4ff":"1px solid #333"}})}))
        ),
        React.createElement("div",{style:{padding:10,overflowY:"auto"}},
          React.createElement("div",{style:sT},"📐 사이즈"),
          Object.keys(PLATFORMS).map(function(key){var pl=PLATFORMS[key];return React.createElement("div",{key:key,style:{marginBottom:6}},
            React.createElement("div",{style:{fontSize:9,color:"#777",marginBottom:2,display:"flex",alignItems:"center",gap:4}},pl.icon," ",React.createElement("span",{style:{fontWeight:600}},pl.name),React.createElement("button",{onClick:function(){var ids=pl.sizes.map(function(s){return s.id});var all=ids.every(function(id){return selIds.indexOf(id)!==-1});setSelIds(function(prev){if(all)return prev.filter(function(x){return ids.indexOf(x)===-1});var s=prev.slice();ids.forEach(function(id){if(s.indexOf(id)===-1)s.push(id)});return s})},style:{marginLeft:"auto",fontSize:8,color:"#444",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}},pl.sizes.every(function(s){return selIds.indexOf(s.id)!==-1})?"해제":"전체")),
            pl.sizes.map(function(s){return React.createElement("label",{key:s.id,style:{display:"flex",alignItems:"center",gap:3,padding:"1px 2px",cursor:"pointer",fontSize:10}},React.createElement("input",{type:"checkbox",checked:selIds.indexOf(s.id)!==-1,onChange:function(){toggleSize(s.id)},style:{accentColor:"#00d4ff"}}),React.createElement("span",{style:{color:"#999",fontSize:9,width:56,fontFamily:"'JetBrains Mono',monospace"}},s.w+"×"+s.h),React.createElement("span",{style:{color:"#666",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},s.label))})
          )}),
          customSizes.length>0&&React.createElement("div",{style:{marginBottom:6}},React.createElement("div",{style:{fontSize:9,color:"#777",marginBottom:2,fontWeight:600}},"✏️ 커스텀"),customSizes.map(function(s){return React.createElement("label",{key:s.id,style:{display:"flex",alignItems:"center",gap:3,padding:"1px 2px",fontSize:10}},React.createElement("input",{type:"checkbox",checked:selIds.indexOf(s.id)!==-1,onChange:function(){toggleSize(s.id)},style:{accentColor:"#00d4ff"}}),React.createElement("span",{style:{color:"#999",fontSize:9,width:56}},s.w+"×"+s.h),React.createElement("span",{style:{color:"#666",flex:1}},s.label),React.createElement("button",{onClick:function(){setCustomSizes(function(p){return p.filter(function(x){return x.id!==s.id})})},style:{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:9}},"✕"))})),
          React.createElement("button",{onClick:function(){setShowCF(!showCF)},style:{width:"100%",padding:"3px",border:"1px dashed #333",borderRadius:3,background:"transparent",color:"#444",cursor:"pointer",fontSize:10,fontFamily:"inherit"}},"+ 커스텀"),
          showCF&&React.createElement("div",{style:{marginTop:4,padding:6,background:"#0a0a0a",borderRadius:4,border:"1px solid #222"}},React.createElement("input",{placeholder:"이름",value:customForm.name,onChange:function(e){setCustomForm(function(p){return Object.assign({},p,{name:e.target.value})})},style:Object.assign({},iS,{marginBottom:3})}),React.createElement("div",{style:{display:"flex",gap:3,marginBottom:3}},React.createElement("input",{placeholder:"W",type:"number",value:customForm.w,onChange:function(e){setCustomForm(function(p){return Object.assign({},p,{w:e.target.value})})},style:Object.assign({},iS,{flex:1})}),React.createElement("span",{style:{color:"#333",lineHeight:"22px"}},"×"),React.createElement("input",{placeholder:"H",type:"number",value:customForm.h,onChange:function(e){setCustomForm(function(p){return Object.assign({},p,{h:e.target.value})})},style:Object.assign({},iS,{flex:1})})),React.createElement("button",{onClick:addCustom,style:{width:"100%",padding:"3px",background:"#00d4ff",border:"none",borderRadius:3,color:"#000",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}},"추가"))
        )
      ),

      /* CENTER */
      React.createElement("div",{ref:canvasRef,onMouseDown:startPan,style:{flex:1,overflow:"hidden",background:"radial-gradient(circle at top, #111927 0%, #0b1017 100%)",position:"relative",cursor:spaceHeld||isPanning?"grab":"default",backgroundImage:"radial-gradient(circle,rgba(148,163,184,.14) 1px,transparent 1px)",backgroundSize:"24px 24px"}},
        React.createElement("div",{ref:viewportRef,style:{transform:"translate("+pan.x+"px,"+pan.y+"px) scale("+zoom+")",transformOrigin:"0 0",display:"flex",flexWrap:"wrap",gap:20,alignItems:"flex-start",padding:40,width:"max-content"}},
          visSizes.length===0?React.createElement("div",{style:{color:"#333",fontSize:13,padding:40}},"← 좌측에서 사이즈를 선택하세요"):visSizes.map(function(s){return renderBoard(s)})
        ),
        /* Context Menu (우클릭 메뉴) */
        ctxMenu&&React.createElement("div",{style:{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,background:MD.surface,border:"1px solid "+MD.line,borderRadius:16,padding:6,zIndex:9999,boxShadow:MD.shadow,width:190,fontFamily:"Roboto,'Noto Sans KR',sans-serif"}},
          ctxMenu.lid ? React.createElement(React.Fragment,null,
            React.createElement("div",{className:"ctx-item",onClick:function(){
              saveHistory(); setLayers(function(prev){var idx=prev.findIndex(function(l){return l.id===ctxMenu.lid});if(idx<0)return prev;var n=prev.slice();n[idx]=Object.assign({},n[idx],{zIndex:n[idx].zIndex+1});return n}); setCtxMenu(null);
            }},"▲ 앞으로 가져오기"),
            React.createElement("div",{className:"ctx-item",onClick:function(){
              saveHistory(); setLayers(function(prev){var idx=prev.findIndex(function(l){return l.id===ctxMenu.lid});if(idx<0)return prev;var n=prev.slice();n[idx]=Object.assign({},n[idx],{zIndex:n[idx].zIndex-1});return n}); setCtxMenu(null);
            }},"▼ 뒤로 보내기"),
            React.createElement("div",{className:"ctx-item",onClick:function(){
              saveHistory(); var orig=layers.find(function(l){return l.id===ctxMenu.lid}); if(!orig)return; var newId=orig.type.charAt(0)+Date.now(); var clone=Object.assign({},orig,{id:newId,zIndex:layers.length}); setLayers(function(p){return p.concat([clone])}); setActiveEl(newId); setSelectedEls([newId]); setCtxMenu(null);
            }},"📑 레이어 복제"),
            React.createElement("div",{className:"ctx-item",onClick:function(){
              saveHistory(); setOverrides(function(prev){var n=Object.assign({},prev);if(n[ctxMenu.sid]){var b=Object.assign({},n[ctxMenu.sid]);delete b[ctxMenu.lid];n[ctxMenu.sid]=b}return n}); setCtxMenu(null);
            }},"🔄 기본 위치 복원"),
            (function(){
              var isHidden = overrides[ctxMenu.sid]?.[ctxMenu.lid]?.hidden; if(isHidden===undefined) isHidden = boardDefaults[ctxMenu.sid]?.[ctxMenu.lid]?.hidden;
              return React.createElement("div",{className:"ctx-item",onClick:function(){saveHistory();setOv(ctxMenu.sid,ctxMenu.lid,{hidden:!isHidden});setCtxMenu(null);}}, isHidden?"👁 보드 숨김 해제":"🚫 이 보드에서 숨기기")
            })(),
            React.createElement("div",{style:{height:1,background:"#444",margin:"4px 0"}}),
            React.createElement("div",{className:"ctx-item danger",onClick:function(){
              saveHistory(); removeLayerFromBoard(ctxMenu.sid, ctxMenu.lid); setCtxMenu(null);
            }},"🗑 이 보드에서 삭제")
          ) : React.createElement(React.Fragment,null,
            React.createElement("div",{className:"ctx-item",onClick:function(){
              saveHistory(); setBoardDefaults(function(p){var n=Object.assign({},p);n[ctxMenu.sid]=overrides[ctxMenu.sid]||{};return n;}); setCtxMenu(null);
            }},"💾 현재 배치 기본값 저장"),
            React.createElement("div",{className:"ctx-item danger",onClick:function(){
              saveHistory(); resetBoardState(ctxMenu.sid); setCtxMenu(null);
            }},"🔄 초기 엔진배치로 리셋")
          )
        )
      ),

      /* RIGHT */
      React.createElement("div",{style:{width:280,background:MD.surface,borderLeft:"1px solid "+MD.line,overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column",boxShadow:"inset 1px 0 0 rgba(255,255,255,.03)"}},
        
        /* 다중 선택 전용 UI 패널 */
        selectedEls.length > 1 && activeBoard && React.createElement("div", {style:{padding:10, borderBottom:"1px solid #1a1a1a", background:"rgba(0,212,255,0.05)"}},
          React.createElement("div",{style:sT},"다중 선택됨 ("+selectedEls.length+"개)"),
          React.createElement("div",{style:{fontSize:9,color:"#00d4ff",marginBottom:6}},"선택 그룹 기준 정렬"),
          React.createElement("div",{style:{display:"flex",gap:4}},
            [{k:'L',l:'⇤'},{k:'C',l:'↔'},{k:'R',l:'⇥'},{k:'T',l:'⇡'},{k:'M',l:'↕'},{k:'B',l:'⇣'}].map(function(btn){
              return React.createElement("button",{key:btn.k,onClick:function(){alignSelected(btn.k)},style:{flex:1,padding:"3px",border:"1px solid rgba(0,212,255,0.3)",borderRadius:2,cursor:"pointer",fontSize:12,background:"#0a0a0a",color:"#00d4ff"}},btn.l)
            })
          )
        ),
        
        /* 아트보드 선택 시 UI (레이어 미선택 상태) */
        activeBoard && !activeEl && selectedEls.length === 0 ? (
          React.createElement("div",{style:{padding:10, borderBottom:"1px solid #1a1a1a"}},
            React.createElement("div",{style:sT},"📝 아트보드 설정"),
            (function(){
              var activeSize = getSizeById(activeBoard) || {};
              var ratioParts = getAspectRatioParts(activeSize.w||1, activeSize.h||1);
              return React.createElement(React.Fragment,null,
                React.createElement("div",{style:{fontSize:11, color:"#ccc", marginBottom:10}}, activeSize.w+"×"+activeSize.h+" "+(activeSize.label||"")+" "+getAspectRatioLabel(activeSize.w||1, activeSize.h||1)),
                React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:2,marginBottom:10,minWidth:0}},
                  React.createElement(NumberInput,{label:"W",value:activeSize.w||0,onFocus:saveHistory,onChange:function(v){setBoardSizeProp(activeBoard,"w",v)},min:50,max:4000,step:10,unit:"px"}),
                  React.createElement(NumberInput,{label:"H",value:activeSize.h||0,onFocus:saveHistory,onChange:function(v){setBoardSizeProp(activeBoard,"h",v)},min:50,max:4000,step:10,unit:"px"}),
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:5}},
                    React.createElement("span",{style:{fontSize:10,color:MD.muted,width:42,flexShrink:0}},"비율"),
                    React.createElement("input",{type:"number",min:1,max:1000,step:1,value:ratioParts.w,onFocus:saveHistory,onChange:function(e){setBoardAspectParts(activeBoard,+e.target.value,ratioParts.h)},style:Object.assign({},iS,{flex:1,minWidth:0,width:0,paddingRight:8,appearance:"textfield",MozAppearance:"textfield",WebkitAppearance:"none",borderRadius:12,lineHeight:1.2})}),
                    React.createElement("span",{style:{fontSize:12,color:MD.muted,flexShrink:0}} ,":"),
                    React.createElement("input",{type:"number",min:1,max:1000,step:1,value:ratioParts.h,onFocus:saveHistory,onChange:function(e){setBoardAspectParts(activeBoard,ratioParts.w,+e.target.value)},style:Object.assign({},iS,{flex:1,minWidth:0,width:0,paddingRight:8,appearance:"textfield",MozAppearance:"textfield",WebkitAppearance:"none",borderRadius:12,lineHeight:1.2})})
                  )
                ),
                React.createElement("div",{style:{fontSize:8,color:"#666",marginTop:-4,marginBottom:10}},"비율 조절은 현재 높이를 기준으로 폭을 갱신합니다.")
              );
            })(),
            React.createElement("button",{onClick:function(){
              saveHistory();
              setBoardDefaults(function(p){var n=Object.assign({},p); n[activeBoard]=overrides[activeBoard]||{}; return n;});
            },style:{width:"100%",padding:"6px",border:"1px solid #00d4ff",borderRadius:3,background:"rgba(0,212,255,0.1)",color:"#00d4ff",cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:600}}, "💾 이 배치를 기본값으로 저장"),
            React.createElement("div",{style:{fontSize:8, color:"#666", marginTop:4}},"*이후 오버라이드 리셋 시 이 배치로 돌아옵니다."),
            
            React.createElement("button",{onClick:function(){
              saveHistory();
              resetBoardState(activeBoard);
            },style:{width:"100%",padding:"4px",border:"1px solid #333",borderRadius:3,background:"transparent",color:"#888",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:10}}, "초기 엔진 배치로 공장초기화")
          )
        ) : null,

        activeBoard&&activeEl&&activeLayerObj
          ?activeLayerObj.type==="image"
            ?React.createElement("div",{style:{padding:10}},
                React.createElement("div",{style:sT},"🖼 이미지 레이어"),
                React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:6}},"아트보드: "+((getSizeById(activeBoard)||{}).w)+"×"+((getSizeById(activeBoard)||{}).h)),
                selectedEls.length === 1 && React.createElement("div",{style:{display:"flex",gap:4,marginBottom:10}},
                  [{k:'L',l:'⇤'},{k:'C',l:'↔'},{k:'R',l:'⇥'},{k:'T',l:'⇡'},{k:'M',l:'↕'},{k:'B',l:'⇣'}].map(function(btn){
                    return React.createElement("button",{key:btn.k,onClick:function(){alignSelected(btn.k)},style:{flex:1,padding:"3px",border:"1px solid #222",borderRadius:2,cursor:"pointer",fontSize:12,background:"#1a1a1a",color:"#00d4ff"}},btn.l)
                  })
                ),
                (function(){
                  var er=getElRect(activeBoard,activeLayerObj);
                  return React.createElement(React.Fragment,null,
                    React.createElement(NumberInput,{label:"X(%)",value:er.x,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{x:v})},min:-50,max:100,unit:"%"}),
                    React.createElement(NumberInput,{label:"Y(%)",value:er.y,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{y:v})},min:-50,max:100,unit:"%"}),
                    React.createElement(NumberInput,{label:"W(%)",value:er.w,onFocus:saveHistory,onChange:function(v){
                      var sz = getSizeById(activeBoard);
                      setOv(activeBoard,activeEl,{w:Math.max(5,v), h:Math.max(5,v)*(sz.w/sz.h)})
                    },min:5,max:200,unit:"%"}),
                    React.createElement(NumberInput,{label:"H(%)",value:er.h,onFocus:saveHistory,onChange:function(v){
                      var sz = getSizeById(activeBoard);
                      setOv(activeBoard,activeEl,{w:Math.max(5,v)*(sz.h/sz.w), h:Math.max(5,v)})
                    },min:5,max:200,unit:"%"})
                  )
                })(),
                React.createElement("button",{onClick:function(){saveHistory();clearBoardLayerOverride(activeBoard,activeEl)},style:{width:"100%",padding:"4px",border:"1px solid #222",borderRadius:3,background:"#0a0a0a",color:"#555",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:4}},"기본값 복원"),
                (function(){
                  var isHidden = overrides[activeBoard]?.[activeEl]?.hidden;
                  if(isHidden === undefined) isHidden = boardDefaults[activeBoard]?.[activeEl]?.hidden;
                  return React.createElement("button",{onClick:function(){
                    saveHistory();
                    setOv(activeBoard, activeEl, {hidden: !isHidden});
                  },style:{width:"100%",padding:"4px",border:isHidden?"1px solid #00d4ff":"1px solid #552222",borderRadius:3,background:isHidden?"rgba(0,212,255,0.1)":"rgba(255,0,0,0.1)",color:isHidden?"#00d4ff":"#f44",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:4}}, isHidden ? "👁 이 보드에서 숨김 해제" : "🚫 이 보드에서 숨기기")
                })(),
                React.createElement("div",{style:{marginTop:10, paddingTop:10, borderTop:"1px solid #1a1a1a"}},
                  React.createElement("div",{style:sT},"✂️ 이미지 내부 마스킹/크롭"),
                  React.createElement(NumberInput,{label:"Scale",value:getOv(activeBoard,activeEl).imgS??1,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{imgS:v})},min:0.1,max:5,step:0.05}),
                  React.createElement(NumberInput,{label:"Pan X",value:getOv(activeBoard,activeEl).imgX??0,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{imgX:v})},min:-200,max:200,step:1,unit:"%"}),
                  React.createElement(NumberInput,{label:"Pan Y",value:getOv(activeBoard,activeEl).imgY??0,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{imgY:v})},min:-200,max:200,step:1,unit:"%"})
                )
              )
            :React.createElement(React.Fragment,null,
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"✏️ 텍스트 편집창"),
                React.createElement("textarea",{value:activeLayerObj.content,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"content",e.target.value)},rows:2,style:Object.assign({},iS,{fontFamily:"Pretendard,'Noto Sans KR',sans-serif",fontSize:11,resize:"vertical"})}),
                
                // 에이전트 요약 기능 UI 버튼
                React.createElement("button",{onClick:function(){ runAgenticSummary(activeBoard, activeEl, activeLayerObj.content) }, disabled: summarizingId === activeEl, style:{width:"100%",padding:"6px",border:"1px solid #ff00ff",borderRadius:3,background:summarizingId === activeEl ? "#333" : "rgba(255,0,255,0.1)",color:summarizingId === activeEl ? "#aaa" : "#ff00ff",cursor:summarizingId === activeEl ? "default" : "pointer",fontSize:10,fontFamily:"inherit",fontWeight:600, marginTop:6}}, 
                  summarizingId === activeEl ? "🤖 에이전트가 최적 카피 분석 중..." : "✨ AI 에이전트 카피 자동 요약"
                )
              ),
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"📐 정렬 / 상태"),
                selectedEls.length === 1 && React.createElement("div",{style:{display:"flex",gap:4,marginBottom:10}},
                  [{k:'L',l:'⇤'},{k:'C',l:'↔'},{k:'R',l:'⇥'},{k:'T',l:'⇡'},{k:'M',l:'↕'},{k:'B',l:'⇣'}].map(function(btn){
                    return React.createElement("button",{key:btn.k,onClick:function(){alignSelected(btn.k)},style:{flex:1,padding:"3px",border:"1px solid #222",borderRadius:2,cursor:"pointer",fontSize:12,background:"#1a1a1a",color:"#00d4ff"}},btn.l)
                  })
                ),
                React.createElement("button",{onClick:function(){saveHistory();clearBoardLayerOverride(activeBoard,activeEl)},style:{width:"100%",padding:"4px",border:"1px solid #222",borderRadius:3,background:"#0a0a0a",color:"#555",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:4}},"오버라이드 리셋"),
                (function(){
                  var isHidden = overrides[activeBoard]?.[activeEl]?.hidden;
                  if(isHidden === undefined) isHidden = boardDefaults[activeBoard]?.[activeEl]?.hidden;
                  return React.createElement("button",{onClick:function(){
                    saveHistory();
                    setOv(activeBoard, activeEl, {hidden: !isHidden});
                  },style:{width:"100%",padding:"4px",border:isHidden?"1px solid #00d4ff":"1px solid #552222",borderRadius:3,background:isHidden?"rgba(0,212,255,0.1)":"rgba(255,0,0,0.1)",color:isHidden?"#00d4ff":"#f44",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:4}}, isHidden ? "👁 이 보드에서 숨김 해제" : "🚫 이 보드에서 숨기기")
                })()
              ),
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"🔤 타이포"),
                (function(){var er=getElRect(activeBoard,activeLayerObj);return React.createElement("div",{style:{fontSize:9,color:"#64748b",marginBottom:6}},"현재 렌더 폰트 크기 "+Math.round(er.fs*10)/10+"px 기준")})(),
                React.createElement("div",{style:{display:"flex",gap:4,marginBottom:4}},
                  React.createElement("select",{value:activeLayerObj.font,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"font",e.target.value)},style:Object.assign({},iS,{flex:1})},allFontsList.map(function(f){return React.createElement("option",{key:f.family,value:f.family},f.family)}))
                ),
                React.createElement("div",{style:{display:"flex",gap:4,marginBottom:8}},
                  React.createElement("input",{type:"text",placeholder:"구글 웹폰트명 (예: Jua)",value:customFontInput,onChange:function(e){setCustomFontInput(e.target.value)},style:Object.assign({},iS,{flex:1})}),
                  React.createElement("button",{onClick:handleAddCustomFont,style:{padding:"3px 8px",background:"#00d4ff",color:"#000",border:"none",borderRadius:3,cursor:"pointer",fontSize:10,fontWeight:"bold"}},"추가")
                ),
                React.createElement("div",{style:{display:"flex",gap:6,marginBottom:4}},
                  React.createElement("div",{style:{flex:1}},React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:2}},"폰트사이즈 (px)"),React.createElement("input",{type:"number",min:6,max:300,value:(function(){var er=getElRect(activeBoard,activeLayerObj);return Math.round(er.fs)})(),onFocus:saveHistory,onChange:function(e){setOv(activeBoard,activeEl,{fs:clamp(+e.target.value||0,6,300)})},style:iS})),
                  React.createElement("div",{style:{flex:1}},React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:2}},"폰트웨이트 (100-900)"),React.createElement("select",{value:activeLayerObj.weight,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"weight",+e.target.value)},style:iS},(allFontsList.find(function(f){return f.family===activeLayerObj.font})||{weights:[400,700]}).weights.map(function(w){return React.createElement("option",{key:w,value:w},w)})))
                ),
                React.createElement("div",{style:{marginBottom:4}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"자간"),React.createElement("span",{style:{fontSize:9,color:"#666"}},trackingEmToPercent(activeLayerObj.ls)+"%")),React.createElement("input",{type:"range",min:-30,max:30,step:1,value:trackingEmToPercent(activeLayerObj.ls),onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"ls",trackingPercentToEm(+e.target.value))},style:{width:"100%",accentColor:"#00d4ff"}})),
                React.createElement("div",{style:{marginBottom:4}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"행간"),React.createElement("span",{style:{fontSize:9,color:"#666"}},lineHeightValueToPercent(activeLayerObj.lh||DEFAULT_LINE_HEIGHT)+"%")),React.createElement("input",{type:"range",min:80,max:260,step:5,value:lineHeightValueToPercent(activeLayerObj.lh||DEFAULT_LINE_HEIGHT),onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"lh",lineHeightPercentToValue(+e.target.value))},style:{width:"100%",accentColor:"#00d4ff"}})),
                React.createElement("div",{style:{display:"flex",gap:2}},[{v:"left",l:"좌측"},{v:"center",l:"중앙"},{v:"right",l:"우측"},{v:"justify",l:"양쪽"}].map(function(a){return React.createElement("button",{key:a.v,onClick:function(){saveHistory();setBoardLayerProp(activeBoard,activeEl,"align",a.v)},style:{flex:1,padding:"4px",border:"none",borderRadius:2,cursor:"pointer",fontSize:10,fontFamily:"inherit",background:activeLayerObj.align===a.v?"rgba(0,212,255,.12)":"#0a0a0a",color:activeLayerObj.align===a.v?"#00d4ff":"#444"}},a.l)}))
              ),
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"🎨 컬러"),
                React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",marginBottom:6}},
                  React.createElement("input",{type:"color",value:activeLayerObj.color,onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"color",e.target.value)},style:{width:22,height:22,border:"none",borderRadius:3,cursor:"pointer",padding:0,background:"none"}}),
                  React.createElement("button",{onClick:function(){pickColorWithEyedropper(function(hex){saveHistory();setBoardLayerProp(activeBoard,activeEl,"color",hex);});},disabled:typeof window==="undefined" || typeof window.EyeDropper!=="function",style:{width:26,height:26,border:"1px solid "+MD.line,borderRadius:8,background:MD.surface2,color:MD.text,cursor:typeof window!=="undefined" && typeof window.EyeDropper==="function"?"pointer":"default",fontSize:12,flexShrink:0,fontFamily:"inherit",opacity:typeof window!=="undefined" && typeof window.EyeDropper==="function"?1:.45}},"⛶"),
                  React.createElement("input",{type:"text",value:activeLayerObj.color,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"color",e.target.value)},style:Object.assign({},iS,{flex:1})})
                ),
                activeLayerObj.role==="cta"&&React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",marginBottom:6}},
                  React.createElement("input",{type:"color",value:activeLayerObj.bg||"#A50034",onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"bg",e.target.value)},style:{width:22,height:22,border:"none",borderRadius:3,cursor:"pointer",padding:0,background:"none"}}),
                  React.createElement("button",{onClick:function(){pickColorWithEyedropper(function(hex){saveHistory();setBoardLayerProp(activeBoard,activeEl,"bg",hex);});},disabled:typeof window==="undefined" || typeof window.EyeDropper!=="function",style:{width:26,height:26,border:"1px solid "+MD.line,borderRadius:8,background:MD.surface2,color:MD.text,cursor:typeof window!=="undefined" && typeof window.EyeDropper==="function"?"pointer":"default",fontSize:12,flexShrink:0,fontFamily:"inherit",opacity:typeof window!=="undefined" && typeof window.EyeDropper==="function"?1:.45}},"⛶"),
                  React.createElement("input",{type:"text",value:activeLayerObj.bg||"#A50034",onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"bg",e.target.value)},style:Object.assign({},iS,{flex:1})}),
                  React.createElement("span",{style:{fontSize:8,color:"#444"}},"CTA")
                ),
                React.createElement("div",{style:{padding:5,background:"#0a0a0a",borderRadius:3,border:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"대비율"),React.createElement("span",{style:{fontSize:10,fontWeight:700,color:crVal>=4.5?"#4ade80":crVal>=3?"#fbbf24":"#ef4444"}},crVal.toFixed(1)+":1 "+(crVal>=4.5?"✅":crVal>=3?"⚠️":"❌")))
              ),
              React.createElement("div",{style:{padding:"0 10px 10px",fontSize:10,color:MD.muted,lineHeight:1.6}},
                "레이어 삭제는 좌측 레이어 목록의 휴지통 아이콘에서 할 수 있습니다."
              )
            )
          : (!activeBoard ? React.createElement("div",{style:{padding:16,margin:12,border:"1px dashed "+MD.line,borderRadius:16,background:"rgba(255,255,255,.02)",color:MD.muted,fontSize:11,lineHeight:1.7,textAlign:"center",marginTop:20,opacity:.74}},
              React.createElement("div",{style:{fontSize:10,textTransform:"uppercase",letterSpacing:".08em",fontWeight:700,marginBottom:8,color:MD.muted}},"Properties Disabled"),
              React.createElement("div",null,"아트보드를 먼저 선택하면"),
              React.createElement("div",null,"속성 패널이 활성화됩니다.")
            ) : null),
        React.createElement("div",{style:{padding:8,borderTop:"1px solid #1a1a1a",marginTop:"auto",fontSize:9,color:"#333",lineHeight:1.8}},
          React.createElement("div",null,"🖱 스크롤: 줌 | Space+드래그: 패닝"),
          React.createElement("div",null,"단축키: Ctrl+Z (실행취소)"),
          React.createElement("div",null,"사이즈 ",React.createElement("span",{style:{color:"#888"}},visSizes.length)," | 레이어 ",React.createElement("span",{style:{color:"#888"}},layers.length))
        )
      )
    ),

    React.createElement("div",{style:{height:220,background:MD.surface,borderTop:"1px solid "+MD.line,display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"0 -4px 16px rgba(15,23,42,.04)"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"14px 16px 10px",borderBottom:"1px solid "+MD.line}},
        React.createElement("div",{style:{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:".08em",fontWeight:700}},"Saved History"),
        React.createElement("div",{style:{fontSize:11,color:MD.muted}},"현재 작업 상태를 저장하고 불러오기"),
        React.createElement("div",{style:{marginLeft:"auto",fontSize:11,color:saveBusy?MD.primary:MD.muted}},saveBusy?"저장 중...":saveMessage)
      ),
      React.createElement("div",{style:{display:"flex",gap:14,padding:"14px 16px",minHeight:0,flex:1}},
        React.createElement("div",{style:{width:280,display:"flex",flexDirection:"column",gap:8,flexShrink:0}},
          React.createElement("div",{style:{fontSize:11,color:MD.text,fontWeight:700}},"현재 상태 저장"),
          React.createElement("input",{type:"text",value:saveNameDraft,onChange:function(e){setSaveNameDraft(e.target.value);},placeholder:formatSnapshotDefaultName(new Date()),style:{background:"#111",border:"1px solid #222",borderRadius:10,padding:"10px 12px",color:"#ddd",fontSize:11,fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}),
          React.createElement("div",{style:{fontSize:10,color:MD.muted,lineHeight:1.6}},"저장명을 비워두면 오늘 날짜와 시간으로 자동 저장됩니다."),
          React.createElement("button",{onClick:handleSaveProjectSnapshot,disabled:saveBusy,style:{padding:"9px 12px",borderRadius:10,border:"none",background:saveBusy?"#222":"linear-gradient(135deg,#7cc4ff,#4da2ff)",color:saveBusy?"#667085":"#08111b",cursor:saveBusy?"default":"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}},"현재 작업 저장"),
          React.createElement("div",{style:{fontSize:10,color:"#64748b",lineHeight:1.6,padding:"10px 12px",border:"1px dashed "+MD.line,borderRadius:12,background:"rgba(255,255,255,.02)"}},"불러오기 전에는 경고창으로 현재 저장되지 않은 변경사항이 사라질 수 있음을 다시 확인합니다.")
        ),
        React.createElement("div",{style:{flex:1,minWidth:0,overflowX:"hidden",overflowY:"auto"}},
          savedProjects.length===0
            ?React.createElement("div",{style:{height:"100%",minHeight:120,border:"1px dashed #222",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontSize:12,textAlign:"center",padding:20}},"저장된 작업 히스토리가 아직 없습니다.")
            :React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10,paddingRight:4}},
                savedProjects.map(function(entry){
                  return React.createElement("div",{key:entry.id,style:{border:"1px solid #222",borderRadius:12,background:"#111",overflow:"hidden",display:"flex",alignItems:"stretch",minHeight:112}},
                    React.createElement("div",{style:{flex:1,minWidth:0,padding:"12px 12px 10px",display:"flex",flexDirection:"column",justifyContent:"space-between"}},
                      React.createElement("div",null,
                        React.createElement("div",{style:{fontSize:11,color:"#e2e8f0",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},entry.name),
                        React.createElement("div",{style:{fontSize:10,color:"#64748b",marginTop:4}},formatSnapshotSavedAt(entry.savedAt)),
                        React.createElement("div",{style:{fontSize:10,color:"#64748b",marginTop:2}},entry.thumbRatio ? "정방형 썸네일 기준 " + entry.thumbRatio : "정방형 배너 없음")
                      ),
                      React.createElement("div",{style:{display:"flex",gap:6,marginTop:10}},
                        React.createElement("button",{onClick:function(){handleLoadProjectSnapshot(entry);},style:{flex:1,padding:"6px 0",border:"none",borderRadius:8,background:"rgba(124,196,255,.14)",color:MD.primary,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}},"Load"),
                        React.createElement("button",{onClick:function(){handleDeleteProjectSnapshot(entry.id);},style:{padding:"6px 10px",border:"1px solid rgba(255,123,114,.24)",borderRadius:8,background:"transparent",color:MD.danger,cursor:"pointer",fontSize:10,fontFamily:"inherit"}},"삭제")
                      )
                    ),
                    React.createElement("div",{style:{width:112,flexShrink:0,background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",borderLeft:"1px solid #1a1a1a"}},
                      entry.thumbnail
                        ?React.createElement("img",{src:entry.thumbnail,alt:entry.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block",aspectRatio:"1 / 1"}})
                        :React.createElement("div",{style:{padding:12,textAlign:"center",fontSize:11,color:"#475569",lineHeight:1.5}},"정방형 배너 썸네일 없음")
                    )
                  );
                })
              )
        )
      )
    )
  );
}

