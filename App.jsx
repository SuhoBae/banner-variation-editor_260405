import React, { useState, useRef, useEffect, useCallback } from "react";

import NumberInput from "./src/adcanvas/components/NumberInput.jsx";
import ResizeHandles from "./src/adcanvas/components/ResizeHandles.jsx";
import LayerListPanel from "./src/adcanvas/components/LayerListPanel.jsx";

var FONTS = [
  {family:"Noto Sans KR",weights:[300,400,500,700,800,900]},{family:"Nanum Gothic",weights:[400,700,800]},
  {family:"Noto Serif KR",weights:[300,400,500,700,900]},{family:"Black Han Sans",weights:[400]},
  {family:"Roboto",weights:[300,400,500,700,900]},{family:"Montserrat",weights:[300,400,500,600,700,800,900]},
  {family:"Playfair Display",weights:[400,500,600,700,800,900]},{family:"Oswald",weights:[300,400,500,600,700]},
];
var PLATFORMS = {
  gdn:{name:"Google Display",icon:"📐",sizes:[
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
var iS={background:MD.surface2,border:"1px solid "+MD.line,borderRadius:12,padding:"8px 10px",color:MD.text,fontSize:12,fontFamily:"Roboto,'Noto Sans KR',sans-serif",width:"100%",boxSizing:"border-box",boxShadow:"inset 0 1px 0 rgba(255,255,255,.03)"};
var sT={fontSize:11,color:MD.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,fontWeight:700};
var hSt={background:MD.primary,position:"absolute",zIndex:30,boxShadow:"0 1px 3px rgba(26,115,232,.35)"};
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
  probe.style.fontFamily='"'+fontFamily+'","Noto Sans KR",sans-serif';
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
function readEditableText(node){
  if(!node) return "";
  function walk(current){
    if(!current) return "";
    if(current.nodeType===3) return current.nodeValue || "";
    if(current.nodeName==="BR") return "\n";
    var out="";
    var children=Array.from(current.childNodes || []);
    children.forEach(function(child,index){
      out += walk(child);
      if((child.nodeName==="DIV" || child.nodeName==="P") && index < children.length-1) out += "\n";
    });
    return out;
  }
  return walk(node).replace(/\u00A0/g," ");
}
function getLayerDisplayName(layer){
  if(!layer) return "";
  if(layer.name) return layer.name;
  if(layer.type==="image") return layer.label || "이미지 영역";
  return (ROLES.find(function(r){return r.key===layer.role}) || {}).label || layer.role || "텍스트";
}

export default function App(){
  var fileRef=useRef(null),assetFileRef=useRef(null),imgObjRef=useRef(null),dragRef=useRef(null),canvasRef=useRef(null),viewportRef=useRef(null),panRef=useRef(null),lastPointerRef=useRef(null),editingRef=useRef(null),editingDraftRef=useRef(""),isComposingRef=useRef(false);
  var _bg=useState("#0f0f0f");var bgColor=_bg[0],setBgColor=_bg[1];
  var _z=useState(1);var zoom=_z[0],setZoom=_z[1];
  var _pan=useState({x:0,y:0});var pan=_pan[0],setPan=_pan[1];
  var _ss=useState(true);var showSafe=_ss[0],setShowSafe=_ss[1];
  var _sg=useState(false);var showGrid=_sg[0],setShowGrid=_sg[1];
  var _clip=useState(false);var clipBoard=_clip[0],setClipBoard=_clip[1]; 
  var _sp=useState(false);var spaceHeld=_sp[0],setSpaceHeld=_sp[1];
  var _ip=useState(false);var isPanning=_ip[0],setIsPanning=_ip[1];
  var _ctx=useState(null);var ctxMenu=_ctx[0],setCtxMenu=_ctx[1]; 

  var _layers=useState([
    {id:"img1",type:"image",label:"메인 비주얼",name:"메인 비주얼",src:null,imgW:0,imgH:0,visible:true,zIndex:0},
    {id:"l1",type:"text",name:"메인 카피",role:"headline",content:"여름맞이 최대 50% 할인",font:"Noto Sans KR",size:48,weight:800,ls:-.02,lh:1.25,color:"#FFFFFF",align:"center",visible:true,zIndex:1},
    {id:"l2",type:"text",name:"보조 카피",role:"subheadline",content:"LG 베스트샵 전 제품",font:"Noto Sans KR",size:24,weight:500,ls:0,lh:1.4,color:"#CCCCCC",align:"center",visible:true,zIndex:2},
    {id:"l3",type:"text",name:"CTA 버튼",role:"cta",content:"자세히 보기",font:"Noto Sans KR",size:20,weight:700,ls:.02,lh:1,color:"#FFFFFF",align:"center",visible:true,bg:"#A50034",zIndex:3},
  ]);var layers=_layers[0],setLayers=_layers[1];
  
  var _ov=useState({});var overrides=_ov[0],setOverrides=_ov[1];
  var _bd=useState({});var boardDefaults=_bd[0],setBoardDefaults=_bd[1];
  
  var _cfnt=useState([]); var customFonts=_cfnt[0],setCustomFonts=_cfnt[1];
  var _cfntIn=useState(""); var customFontInput=_cfntIn[0],setCustomFontInput=_cfntIn[1];
  var _assetLib=useState([]); var assetLibrary=_assetLib[0],setAssetLibrary=_assetLib[1];
  var _assetUrl=useState(""); var assetUrlInput=_assetUrl[0],setAssetUrlInput=_assetUrl[1];
  var _assetMsg=useState("여러 PNG 업로드 또는 URL 붙여넣기로 에셋 트레이를 채우세요."); var assetMessage=_assetMsg[0],setAssetMessage=_assetMsg[1];
  var _assetBusy=useState(false); var assetLoading=_assetBusy[0],setAssetLoading=_assetBusy[1];
  
  var _sumId=useState(null); var summarizingId=_sumId[0], setSummarizingId=_sumId[1]; // 에이전트 요약 상태
  
  var histRef = useRef({ past: [], future: [] });
  var stateRef = useRef({ layers: layers, overrides: overrides, bgColor: bgColor, boardDefaults: boardDefaults, customFonts: customFonts });
  var _hc=useState(0); var setHistCount=_hc[1];
  
  useEffect(function() {
    stateRef.current = { layers: layers, overrides: overrides, bgColor: bgColor, boardDefaults: boardDefaults, customFonts: customFonts };
  }, [layers, overrides, bgColor, boardDefaults, customFonts]);

  var saveHistory = useCallback(function() {
    var st = JSON.parse(JSON.stringify(stateRef.current));
    var p = histRef.current.past;
    if(p.length === 0 || JSON.stringify(p[p.length-1]) !== JSON.stringify(st)) {
      p.push(st);
      if(p.length > 50) p.shift();
      histRef.current.future = [];
      setHistCount(function(c){return c+1});
    }
  }, []);

  var undo = useCallback(function() {
    var p = histRef.current.past;
    if (p.length === 0) return;
    var prev = p.pop();
    histRef.current.future.push(JSON.parse(JSON.stringify(stateRef.current)));
    setLayers(prev.layers);
    setOverrides(prev.overrides);
    setBgColor(prev.bgColor);
    setBoardDefaults(prev.boardDefaults || {});
    setCustomFonts(prev.customFonts || []);
    setHistCount(function(c){return c+1});
    setActiveEl(null); setSelectedEls([]);
    setCtxMenu(null);
  }, []);

  var redo = useCallback(function() {
    var f = histRef.current.future;
    if (f.length === 0) return;
    var next = f.pop();
    histRef.current.past.push(JSON.parse(JSON.stringify(stateRef.current)));
    setLayers(next.layers);
    setOverrides(next.overrides);
    setBgColor(next.bgColor);
    setBoardDefaults(next.boardDefaults || {});
    setCustomFonts(next.customFonts || []);
    setHistCount(function(c){return c+1});
    setActiveEl(null); setSelectedEls([]);
    setCtxMenu(null);
  }, []);

  var _sel=useState(["g1","g3","g4","i1","i3","y1"]);var selIds=_sel[0],setSelIds=_sel[1];
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
  
  var allSizes=ALL_SIZES.concat(customSizes);
  var visSizes=allSizes.filter(function(s){return selIds.indexOf(s.id)!==-1});
  var imgLayer=layers.find(function(l){return l.type==="image"});
  var activeBaseLayerObj=layers.find(function(l){return l.id===activeEl});
  var allFontsList = FONTS.concat(customFonts);

  useEffect(function(){
    var l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;800;900&family=Nanum+Gothic:wght@400;700;800&family=Noto+Serif+KR:wght@300;400;500;700;900&family=Black+Han+Sans&family=Roboto:wght@300;400;500;700;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";l.rel="stylesheet";document.head.appendChild(l);
    var s=document.createElement("style");s.innerHTML=".ctx-item { padding: 8px 10px; font-size: 12px; color: "+MD.text+"; cursor: pointer; border-radius: 10px; } .ctx-item:hover { background: "+MD.primarySoft+"; color: "+MD.primary+"; } .ctx-item.danger:hover { background: "+MD.dangerSoft+"; color: "+MD.danger+"; }";document.head.appendChild(s);
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
  function clearLayerSelection(){
    setActiveEl(null);
    setSelectedEls([]);
  }
  function syncEditingStateForLayer(layer){
    if(layer && layer.type==="text" && layer.role!=="cta"){
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
    updateLayer(imgLayer.id,"src",null);
    imgObjRef.current = null;
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
        lh:1.4,
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
    setOverrides(function(prev){
      var n=Object.assign({},prev);
      delete n[sid];
      return n;
    });
  }
  function boardHasChanges(sid){
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
    var sz = allSizes.find(function(s){return s.id===sid});
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
      var textMeasure = measureTextBlock(String(layer.content || ""), er.fs, layer.font, layer.weight, layer.lh, null);
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
    var sz=allSizes.find(function(s){return s.id===sid});if(!sz)return{x:0,y:0,w:100,h:100,fs:12};
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
      var isEditingActive = editingTextId===layer.id && activeBoard===sid && activeEl===layer.id;
      var textContent = String((isEditingActive ? editingDraftValue : layer.content) || "");
      var manualBox = hasManualBoxOverride(sid,layer.id);
      var usesManualWidth = manualBox && ov.w!=null;
      var constrainedWidthPx = usesManualWidth ? (ov.w / 100) * sz.w : null;
      var measured = measureTextBlock(textContent, fs, layer.font, layer.weight, layer.lh, layer.role==="cta" ? null : constrainedWidthPx);
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
      var resolvedW = usesManualWidth ? ov.w : defaultW;
      var resolvedH = ov.h != null ? Math.max(ov.h, defaultH) : defaultH;
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
    
    var sz=allSizes.find(function(s){return s.id===activeBoard}); if(!sz) return;
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
        var sz = allSizes.find(function(s){return s.id===d.sid});
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
    // 휠클릭(1) 이거나, 스페이스바+좌클릭(0) 인 경우에만 패닝 시작
    if(e.button===1 || (e.button===0 && spaceHeld)){
      e.preventDefault();setIsPanning(true);panRef.current={type:"pan",mx:e.clientX,my:e.clientY,sx:pan.x,sy:pan.y,boost:1.22};
    }
  }
  function syncMainImage(src,w,h){
    setLayers(function(p){return p.map(function(l){return l.type==="image"?Object.assign({},l,{src:src,imgW:w||0,imgH:h||0}):l})});
  }
  function appendAssets(nextAssets){
    if(!nextAssets || nextAssets.length===0) return;
    setAssetLibrary(function(prev){
      var merged = prev.slice();
      nextAssets.forEach(function(asset){
        if(!merged.some(function(existing){ return existing.src===asset.src || existing.name===asset.name; })){
          merged.push(asset);
        }
      });
      return merged;
    });
  }
  function applyAsset(asset){
    if(!asset || !asset.src) return;
    saveHistory();
    var img = new Image();
    img.onload = function(){
      imgObjRef.current = img;
      syncMainImage(asset.src, asset.w || img.naturalWidth, asset.h || img.naturalHeight);
      setAssetMessage("선택한 에셋을 메인 비주얼로 적용했습니다: " + asset.name);
    };
    img.src = asset.src;
  }
  function readFileAsset(file){
    return new Promise(function(resolve,reject){
      var reader=new FileReader();
      reader.onload=function(ev){
        var img = new Image();
        img.onload = function(){
          resolve({id:"asset-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),name:file.name,src:ev.target.result,w:img.naturalWidth,h:img.naturalHeight,origin:"upload"});
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function fetchUrlAsAsset(url){
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error("HTTP " + res.status);
      return res.blob();
    }).then(function(blob){
      return new Promise(function(resolve,reject){
        var reader = new FileReader();
        reader.onload = function(ev){
          var img = new Image();
          img.onload = function(){
            var cleanName = url.split("/").pop() || "remote-image";
            resolve({id:"asset-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),name:cleanName,src:ev.target.result,w:img.naturalWidth,h:img.naturalHeight,origin:"url"});
          };
          img.onerror = reject;
          img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
  }
  function handleFile(file){if(!file)return;saveHistory();var reader=new FileReader();reader.onload=function(ev){var img=new Image();img.onload=function(){imgObjRef.current=img;setLayers(function(p){return p.map(function(l){return l.type==="image"?Object.assign({},l,{src:ev.target.result,imgW:img.naturalWidth,imgH:img.naturalHeight}):l})})};img.src=ev.target.result};reader.readAsDataURL(file)}
  function handleAssetFiles(fileList){
    var files = Array.from(fileList || []).filter(function(file){ return file && file.type.indexOf("image/")===0; });
    if(files.length===0){
      setAssetMessage("이미지 파일을 선택해주세요.");
      return;
    }
    setAssetLoading(true);
    Promise.all(files.map(readFileAsset)).then(function(assets){
      appendAssets(assets);
      setAssetMessage(assets.length + "개의 로컬 에셋을 트레이에 추가했습니다.");
    }).catch(function(){
      setAssetMessage("일부 로컬 에셋을 읽지 못했습니다.");
    }).finally(function(){
      setAssetLoading(false);
      if(assetFileRef.current) assetFileRef.current.value = "";
    });
  }
  function importAssetUrls(){
    var urls = assetUrlInput.split(/\r?\n/).map(function(line){ return line.trim(); }).filter(Boolean);
    if(urls.length===0){
      setAssetMessage("이미지 URL을 한 줄에 하나씩 입력해주세요.");
      return;
    }
    setAssetLoading(true);
    Promise.allSettled(urls.map(fetchUrlAsAsset)).then(function(results){
      var assets = results.filter(function(item){ return item.status==="fulfilled"; }).map(function(item){ return item.value; });
      var failed = results.length - assets.length;
      appendAssets(assets);
      if(assets.length && failed===0) setAssetMessage(assets.length + "개의 URL 에셋을 가져왔습니다.");
      else if(assets.length) setAssetMessage(assets.length + "개를 추가했고, " + failed + "개는 CORS 또는 응답 문제로 실패했습니다.");
      else setAssetMessage("URL 에셋을 가져오지 못했습니다. 공개 이미지 URL과 CORS 허용 여부를 확인해주세요.");
      if(assets.length) setAssetUrlInput("");
    }).finally(function(){
      setAssetLoading(false);
    });
  }
  function removeAsset(assetId){
    setAssetLibrary(function(prev){ return prev.filter(function(asset){ return asset.id!==assetId; }); });
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

  function exportOne(sz){return document.fonts.ready.then(function(){var c=document.createElement("canvas");c.width=sz.w;c.height=sz.h;var ctx=c.getContext("2d");ctx.fillStyle=bgColor;ctx.fillRect(0,0,sz.w,sz.h);var sorted=layers.slice().sort(function(a,b){return a.zIndex-b.zIndex});sorted.forEach(function(baseLayer){
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
      var fs=er.fs;if(fs<=0)return;ctx.font=layer.weight+" "+fs+'px "'+layer.font+'","Noto Sans KR",sans-serif';var tx,ty=dy+dh/2;if(layer.align==="center"){ctx.textAlign="center";tx=dx+dw/2}else if(layer.align==="right"){ctx.textAlign="right";tx=dx+dw}else{ctx.textAlign="left";tx=dx}if(layer.role==="cta"&&layer.bg){var met=ctx.measureText(layer.content);var pH=fs*0.3,pV=fs*0.2;var bw=met.width+pH*2,bh=fs+pV*2;var bx=tx-bw/2,by=ty-bh/2;if(layer.align==="left")bx=tx;if(layer.align==="right")bx=tx-bw;ctx.fillStyle=layer.bg;ctx.beginPath();var rd=Math.min(fs*.2,bh/3);ctx.moveTo(bx+rd,by);ctx.lineTo(bx+bw-rd,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+rd);ctx.lineTo(bx+bw,by+bh-rd);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-rd,by+bh);ctx.lineTo(bx+rd,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-rd);ctx.lineTo(bx,by+rd);ctx.quadraticCurveTo(bx,by,bx+rd,by);ctx.closePath();ctx.fill();ctx.textBaseline="middle";ctx.fillStyle=layer.color;ctx.fillText(layer.content,tx,ty);}else{ctx.textBaseline="top";ctx.fillStyle=layer.color;var lines=layer.content.split("\n");var lineH=fs*layer.lh;var startY=dy;for(var li=0;li<lines.length;li++){ctx.fillText(lines[li],tx,startY+(li*lineH));}}}});return new Promise(function(resolve){c.toBlob(function(blob){var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="App_"+sz.w+"x"+sz.h+"_"+sz.label.replace(/[\s/:]+/g,"_")+".png";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);resolve()},"image/png")})})}
  
  function handleExport(){var list=visSizes.filter(function(s){return exportChecked[s.id]});var i=0;(function next(){if(i>=list.length)return;exportOne(list[i]).then(function(){i++;if(i<list.length)setTimeout(next,350)})})()}
  var exportCount=Object.keys(exportChecked).filter(function(k){return exportChecked[k]}).length;
  function updateLayer(id,k,v){setLayers(function(p){return p.map(function(l){if(l.id!==id)return l;var n=Object.assign({},l);n[k]=v;return n})})}
  function toggleSize(id){setSelIds(function(p){return p.indexOf(id)!==-1?p.filter(function(x){return x!==id}):p.concat([id])})}
  function addCustom(){if(!customForm.name||!customForm.w||!customForm.h)return;var id="c"+Date.now();setCustomSizes(function(p){return p.concat([{id:id,w:+customForm.w,h:+customForm.h,label:customForm.name,safe:{t:+customForm.st,b:+customForm.sb,l:+customForm.sl,r:+customForm.sr,pct:false}}])});setSelIds(function(p){return p.concat([id])});setCustomForm({name:"",w:"",h:"",st:"0",sb:"0",sl:"0",sr:"0"});setShowCF(false)}
  var crVal=activeLayerObj&&activeLayerObj.type==="text"?contrast(activeLayerObj.color,bgColor):0;
  var boardScale=.25;

  function renderBoard(sz){
    var dw=sz.w*boardScale,dh=sz.h*boardScale;var sa=getSafe(sz);var isAct=activeBoard===sz.id;var isExp=!!exportChecked[sz.id];var lo=computeLayout(sz.w,sz.h);var mutated=boardHasChanges(sz.id);
    return React.createElement("div",{key:sz.id,style:{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0,verticalAlign:"top"}},
      React.createElement("label",{style:{display:"flex",alignItems:"center",gap:3,fontSize:9,cursor:"pointer",color:isExp?"#00d4ff":"#555",userSelect:"none"}},React.createElement("input",{type:"checkbox",checked:isExp,onChange:function(){setExportChecked(function(p){var n=Object.assign({},p);n[sz.id]=!p[sz.id];return n})},style:{accentColor:"#00d4ff"}}),"Export"),
      React.createElement("div",{"data-bid":sz.id,
        onMouseDown:function(e){if(e.button!==0 || spaceHeld)return; if(e.target.getAttribute("data-bid")===sz.id){setActiveBoard(sz.id);setActiveEl(null);setSelectedEls([]);setEditingTextId(null);}},
        onContextMenu:function(e){handleContextMenuBoard(e, sz.id)},
        style:{width:dw,height:dh,position:"relative",overflow:clipBoard?"hidden":"visible",borderRadius:2,border:isAct?"2px solid #00d4ff":"1px solid #333",background:bgColor,boxSizing:"border-box",boxShadow:isAct?"0 0 12px rgba(0,212,255,.15)":"none"}},
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
              React.createElement("div", {id: "layer-"+sz.id+"-"+layer.id, onClick:function(e){e.stopPropagation();activateLayerSelection(sz.id,layer.id,[layer.id]);}, onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")}, onContextMenu:function(e){handleContextMenuLayer(e, sz.id, layer.id)}, style:{position:"relative", display:"flex", width:"100%", height:"100%", maxWidth:"100%", maxHeight:"100%", border:isSel?"0.5px solid rgba(124,196,255,.92)":(layer.src?"0.5px solid transparent":"0.5px dashed rgba(255,255,255,0.15)"), background:layer.src?"transparent":"rgba(255,255,255,0.03)", pointerEvents:"auto", cursor:spaceHeld?"grab":"move", alignItems:"center", justifyContent:"center", flexDirection:"column", boxSizing:"border-box"}},
                layer.src ? React.createElement("div", {style:{width:"100%", height:"100%", overflow:"hidden", borderRadius:2}}, 
                              React.createElement("img",{src:layer.src,alt:"",draggable:false,style:{width:"100%",height:"100%",objectFit:"cover",transform:"translate("+imgX+"%,"+imgY+"%) scale("+imgS+")",pointerEvents:"none",display:"block"}})
                            )
                          : React.createElement(React.Fragment, null, 
                              null
                            ),
                isSel&&React.createElement(React.Fragment,null,
                  React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",inset:-6,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
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
            React.createElement("div",{id: "layer-"+sz.id+"-"+layer.id, onClick:function(e){e.stopPropagation();activateLayerSelection(sz.id,layer.id,[layer.id]);}, onMouseDown:function(e){if(isEditingText && !isCta){var editableNode=document.getElementById("layer-content-"+sz.id+"-"+layer.id);if(editableNode && editableNode.contains(e.target)) return;} if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")}, onContextMenu:function(e){handleContextMenuLayer(e, sz.id, layer.id)}, style:{position:"relative",display:"flex",width:"100%",height:"100%",maxWidth:"100%",maxHeight:"100%",border:isSel?"0.5px solid rgba(124,196,255,.92)":"0.5px solid transparent", pointerEvents:"auto", cursor:spaceHeld?"grab":"move", fontFamily:'"'+layer.font+'","Noto Sans KR",sans-serif',fontSize:dfs,fontWeight:layer.weight,letterSpacing:layer.ls+"em",lineHeight:layer.lh,color:layer.color,textAlign:layer.align,alignItems:isCta?"center":"flex-start",justifyContent:layer.align==="center"?"center":layer.align==="right"?"flex-end":"flex-start",boxSizing:"border-box",overflow:"visible"}},
              isSel && !isEditingText && React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",inset:-6,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
              isSel && isEditingText && React.createElement(React.Fragment,null,
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-2,left:-2,right:-2,height:4,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",bottom:-2,left:-2,right:-2,height:4,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,left:-2,width:4,cursor:spaceHeld?"grab":"move",background:"transparent"}}),
                React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:2,bottom:2,right:-2,width:4,cursor:spaceHeld?"grab":"move",background:"transparent"}})
              ),
              isSel&&React.createElement("div",{onMouseDown:function(e){if(!spaceHeld)beginDrag(e,sz.id,layer.id,"move")},style:{position:"absolute",top:-8,left:0,fontSize:labelFontSize,color:MD.primary,lineHeight:1,pointerEvents:"auto",whiteSpace:"nowrap",fontWeight:700,letterSpacing:".02em",cursor:spaceHeld?"grab":"move"}},getLayerDisplayName(layer)),
              isEditingText && !isCta
                ?React.createElement("textarea",{ref:editingRef,id:"layer-content-"+sz.id+"-"+layer.id,value:editingDraftValue,spellCheck:false,wrap:textUsesManualBox?"soft":"off",onClick:function(e){e.stopPropagation();},onMouseDown:function(e){e.stopPropagation();},onCompositionStart:function(){isComposingRef.current=true;},onCompositionEnd:function(e){isComposingRef.current=false;e.target.scrollLeft=0;e.target.scrollTop=0;requestAnimationFrame(function(){setTick(function(c){return c+1});});},onChange:function(e){editingDraftRef.current=e.target.value;setEditingDraftValue(e.target.value);e.target.scrollLeft=0;e.target.scrollTop=0;requestAnimationFrame(function(){setTick(function(c){return c+1});});},onBlur:function(){if(isComposingRef.current) return; commitEditingText(sz.id,layer.id,false);},onKeyDown:function(e){if(e.key==="Escape"){e.preventDefault();commitEditingText(sz.id,layer.id,true);e.currentTarget.blur();}},style:{position:"absolute",top:"-0.12em",left:0,whiteSpace:textUsesManualBox?"pre-wrap":"pre",wordBreak:"keep-all",display:"block",width:"100%",minWidth:"100%",maxWidth:"100%",height:"calc(100% + 0.24em)",padding:"0.12em 0",margin:0,border:"none",background:"transparent",outline:"none",overflow:"hidden",resize:"none",cursor:"text",color:"inherit",font:"inherit",letterSpacing:"inherit",lineHeight:"inherit",textAlign:layer.align,boxSizing:"border-box",scrollbarWidth:"none",msOverflowStyle:"none"}}) 
                :isCta&&layer.bg
                  ?React.createElement("span",{id:"layer-content-"+sz.id+"-"+layer.id,style:{background:layer.bg,padding:(dfs*0.2)+"px "+(dfs*0.3)+"px",borderRadius:999,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1,boxShadow:"0 1px 3px rgba(0,0,0,.12)"}} ,layer.content)
                  :React.createElement("span",{id:"layer-content-"+sz.id+"-"+layer.id,style:{position:"absolute",top:0,left:0,whiteSpace:textUsesManualBox?"pre-wrap":"pre",wordBreak:"keep-all",display:"block",width:"100%",maxWidth:"100%",overflow:"visible"}},layer.content),
              isSel&&React.createElement(ResizeHandles,{sid:sz.id,lid:layer.id,beginDrag:beginDrag,fitLayerToContent:fitLayerToContent,allowVertical:false})
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
          React.createElement("div",{style:{position:"absolute",top:"50%",left:0,right:0,borderTop:"1px dashed rgba(0,212,255,.1)"}}),
          React.createElement("div",{style:{position:"absolute",left:"50%",top:0,bottom:0,borderLeft:"1px dashed rgba(0,212,255,.1)"}}),
          React.createElement("div",{style:{position:"absolute",left:lo.image.x+"%",top:lo.image.y+"%",width:lo.image.w+"%",height:lo.image.h+"%",border:"1px dashed rgba(100,200,255,.08)",pointerEvents:"none"}})
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

  return React.createElement("div",{style:{width:"100%",height:"100vh",maxHeight:"100vh",background:"linear-gradient(180deg,#0b1017 0%, #0f1720 100%)",color:MD.text,fontFamily:"Roboto,'Noto Sans KR',sans-serif",fontSize:12,display:"flex",flexDirection:"column",overflow:"hidden"}},

    /* HEADER */
    React.createElement("div",{style:{height:64,background:"rgba(11,16,23,.92)",backdropFilter:"blur(18px)",borderBottom:"1px solid "+MD.line,display:"flex",alignItems:"center",padding:"0 16px",gap:10,flexShrink:0,boxShadow:"0 1px 0 rgba(255,255,255,.02), 0 6px 18px rgba(0,0,0,.2)"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
        React.createElement("div",{style:{width:28,height:28,borderRadius:10,background:"linear-gradient(135deg,#1a73e8,#34a853)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",boxShadow:"0 8px 16px rgba(26,115,232,.2)"}},"A"),
        React.createElement("div",null,
          React.createElement("div",{style:{fontWeight:700,fontSize:14,color:MD.text}},"AdCanvas"),
          React.createElement("div",{style:{fontSize:11,color:MD.muted,marginTop:1}},"Banner variation editor")
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
          onAddTextLayer:handleAddTextLayer
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
              saveHistory(); setBoardDefaults(function(p){var n=Object.assign({},p);delete n[ctxMenu.sid];return n;}); setOverrides(function(prev){var n=Object.assign({},prev);delete n[ctxMenu.sid];return n;}); setCtxMenu(null);
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
            React.createElement("div",{style:{fontSize:11, color:"#ccc", marginBottom:10}}, (allSizes.find(function(s){return s.id===activeBoard})||{}).w+"×"+(allSizes.find(function(s){return s.id===activeBoard})||{}).h+" "+(allSizes.find(function(s){return s.id===activeBoard})||{}).label),
            React.createElement("button",{onClick:function(){
              saveHistory();
              setBoardDefaults(function(p){var n=Object.assign({},p); n[activeBoard]=overrides[activeBoard]||{}; return n;});
            },style:{width:"100%",padding:"6px",border:"1px solid #00d4ff",borderRadius:3,background:"rgba(0,212,255,0.1)",color:"#00d4ff",cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:600}}, "💾 이 배치를 기본값으로 저장"),
            React.createElement("div",{style:{fontSize:8, color:"#666", marginTop:4}},"*이후 오버라이드 리셋 시 이 배치로 돌아옵니다."),
            
            React.createElement("button",{onClick:function(){
              saveHistory();
              setBoardDefaults(function(p){var n=Object.assign({},p); delete n[activeBoard]; return n;});
              setOverrides(function(prev){var n=Object.assign({},prev); delete n[activeBoard]; return n;});
            },style:{width:"100%",padding:"4px",border:"1px solid #333",borderRadius:3,background:"transparent",color:"#888",cursor:"pointer",fontSize:10,fontFamily:"inherit",marginTop:10}}, "초기 엔진 배치로 공장초기화")
          )
        ) : null,

        activeBoard&&activeEl&&activeLayerObj
          ?activeLayerObj.type==="image"
            ?React.createElement("div",{style:{padding:10}},
                React.createElement("div",{style:sT},"🖼 이미지 레이어"),
                React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:6}},"아트보드: "+(allSizes.find(function(s){return s.id===activeBoard})||{}).w+"×"+(allSizes.find(function(s){return s.id===activeBoard})||{}).h),
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
                      var sz = allSizes.find(function(s){return s.id===activeBoard});
                      setOv(activeBoard,activeEl,{w:Math.max(5,v), h:Math.max(5,v)*(sz.w/sz.h)})
                    },min:5,max:200,unit:"%"}),
                    React.createElement(NumberInput,{label:"H(%)",value:er.h,onFocus:saveHistory,onChange:function(v){
                      var sz = allSizes.find(function(s){return s.id===activeBoard});
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
                React.createElement("div",{style:sT},"✏️ "+((ROLES.find(function(r){return r.key===activeLayerObj.role})||{}).label||"Text")),
                React.createElement("select",{value:activeBaseLayerObj.role,onFocus:saveHistory,onChange:function(e){updateLayer(activeEl,"role",e.target.value)},style:Object.assign({},iS,{marginBottom:4})},ROLES.map(function(r){return React.createElement("option",{key:r.key,value:r.key},r.label)})),
                React.createElement("textarea",{value:activeLayerObj.content,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"content",e.target.value)},rows:2,style:Object.assign({},iS,{fontFamily:"'Noto Sans KR',sans-serif",fontSize:11,resize:"vertical"})}),
                
                // 에이전트 요약 기능 UI 버튼
                React.createElement("button",{onClick:function(){ runAgenticSummary(activeBoard, activeEl, activeLayerObj.content) }, disabled: summarizingId === activeEl, style:{width:"100%",padding:"6px",border:"1px solid #ff00ff",borderRadius:3,background:summarizingId === activeEl ? "#333" : "rgba(255,0,255,0.1)",color:summarizingId === activeEl ? "#aaa" : "#ff00ff",cursor:summarizingId === activeEl ? "default" : "pointer",fontSize:10,fontFamily:"inherit",fontWeight:600, marginTop:6}}, 
                  summarizingId === activeEl ? "🤖 에이전트가 최적 카피 분석 중..." : "✨ AI 에이전트 카피 자동 요약"
                )
              ),
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"📐 위치/크기 정렬"),
                selectedEls.length === 1 && React.createElement("div",{style:{display:"flex",gap:4,marginBottom:10}},
                  [{k:'L',l:'⇤'},{k:'C',l:'↔'},{k:'R',l:'⇥'},{k:'T',l:'⇡'},{k:'M',l:'↕'},{k:'B',l:'⇣'}].map(function(btn){
                    return React.createElement("button",{key:btn.k,onClick:function(){alignSelected(btn.k)},style:{flex:1,padding:"3px",border:"1px solid #222",borderRadius:2,cursor:"pointer",fontSize:12,background:"#1a1a1a",color:"#00d4ff"}},btn.l)
                  })
                ),
                (function(){var er=getElRect(activeBoard,activeLayerObj);return React.createElement(React.Fragment,null,
                  React.createElement(NumberInput,{label:"X(%)",value:er.x,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{x:v})},min:-50,max:150,unit:"%"}),
                  React.createElement(NumberInput,{label:"Y(%)",value:er.y,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{y:v})},min:-50,max:150,unit:"%"}),
                  React.createElement(NumberInput,{label:"W(%)",value:er.w,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{w:clamp(v,5,200)})},min:5,max:200,unit:"%"}),
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,marginBottom:5}},
                    React.createElement("span",{style:{fontSize:10,color:MD.muted,width:48,flexShrink:0}},"H(%)"),
                    React.createElement("div",{style:Object.assign({},iS,{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between"})},
                      React.createElement("span",null,Math.round(er.h*100)/100),
                      React.createElement("span",{style:{fontSize:10,color:MD.muted}},"auto")
                    )
                  ),
                  React.createElement(NumberInput,{label:"폰트",value:er.fs,onFocus:saveHistory,onChange:function(v){setOv(activeBoard,activeEl,{fs:clamp(v,6,300)})},min:6,max:300,unit:"px"})
                )})(),
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
                React.createElement("div",{style:{display:"flex",gap:4,marginBottom:4}},
                  React.createElement("select",{value:activeLayerObj.font,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"font",e.target.value)},style:Object.assign({},iS,{flex:1})},allFontsList.map(function(f){return React.createElement("option",{key:f.family,value:f.family},f.family)}))
                ),
                React.createElement("div",{style:{display:"flex",gap:4,marginBottom:8}},
                  React.createElement("input",{type:"text",placeholder:"구글 웹폰트명 (예: Jua)",value:customFontInput,onChange:function(e){setCustomFontInput(e.target.value)},style:Object.assign({},iS,{flex:1})}),
                  React.createElement("button",{onClick:handleAddCustomFont,style:{padding:"3px 8px",background:"#00d4ff",color:"#000",border:"none",borderRadius:3,cursor:"pointer",fontSize:10,fontWeight:"bold"}},"추가")
                ),
                React.createElement("div",{style:{display:"flex",gap:6,marginBottom:4}},
                  React.createElement("div",{style:{flex:1}},React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:2}},"Size"),React.createElement("input",{type:"number",min:8,max:200,value:activeLayerObj.size,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"size",+e.target.value)},style:iS})),
                  React.createElement("div",{style:{flex:1}},React.createElement("div",{style:{fontSize:9,color:"#444",marginBottom:2}},"Wt"),React.createElement("select",{value:activeLayerObj.weight,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"weight",+e.target.value)},style:iS},(allFontsList.find(function(f){return f.family===activeLayerObj.font})||{weights:[400,700]}).weights.map(function(w){return React.createElement("option",{key:w,value:w},w)})))
                ),
                React.createElement("div",{style:{marginBottom:4}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"자간"),React.createElement("span",{style:{fontSize:9,color:"#666"}},activeLayerObj.ls+"em")),React.createElement("input",{type:"range",min:-.1,max:.3,step:.005,value:activeLayerObj.ls,onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"ls",+e.target.value)},style:{width:"100%",accentColor:"#00d4ff"}})),
                React.createElement("div",{style:{marginBottom:4}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"행간"),React.createElement("span",{style:{fontSize:9,color:"#666"}},activeLayerObj.lh)),React.createElement("input",{type:"range",min:.8,max:2.5,step:.05,value:activeLayerObj.lh,onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"lh",+e.target.value)},style:{width:"100%",accentColor:"#00d4ff"}})),
                React.createElement("div",{style:{display:"flex",gap:2}},[{v:"left",l:"좌측"},{v:"center",l:"중앙"},{v:"right",l:"우측"},{v:"justify",l:"양쪽"}].map(function(a){return React.createElement("button",{key:a.v,onClick:function(){saveHistory();setBoardLayerProp(activeBoard,activeEl,"align",a.v)},style:{flex:1,padding:"4px",border:"none",borderRadius:2,cursor:"pointer",fontSize:10,fontFamily:"inherit",background:activeLayerObj.align===a.v?"rgba(0,212,255,.12)":"#0a0a0a",color:activeLayerObj.align===a.v?"#00d4ff":"#444"}},a.l)}))
              ),
              React.createElement("div",{style:{padding:10,borderBottom:"1px solid #1a1a1a"}},
                React.createElement("div",{style:sT},"🎨 컬러"),
                React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",marginBottom:6}},React.createElement("input",{type:"color",value:activeLayerObj.color,onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"color",e.target.value)},style:{width:22,height:22,border:"none",borderRadius:3,cursor:"pointer",padding:0,background:"none"}}),React.createElement("input",{type:"text",value:activeLayerObj.color,onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"color",e.target.value)},style:Object.assign({},iS,{flex:1})})),
                activeLayerObj.role==="cta"&&React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",marginBottom:6}},React.createElement("input",{type:"color",value:activeLayerObj.bg||"#A50034",onMouseDown:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"bg",e.target.value)},style:{width:22,height:22,border:"none",borderRadius:3,cursor:"pointer",padding:0,background:"none"}}),React.createElement("input",{type:"text",value:activeLayerObj.bg||"#A50034",onFocus:saveHistory,onChange:function(e){setBoardLayerProp(activeBoard,activeEl,"bg",e.target.value)},style:Object.assign({},iS,{flex:1})}),React.createElement("span",{style:{fontSize:8,color:"#444"}},"CTA")),
                React.createElement("div",{style:{padding:5,background:"#0a0a0a",borderRadius:3,border:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center"}},React.createElement("span",{style:{fontSize:9,color:"#444"}},"대비율"),React.createElement("span",{style:{fontSize:10,fontWeight:700,color:crVal>=4.5?"#4ade80":crVal>=3?"#fbbf24":"#ef4444"}},crVal.toFixed(1)+":1 "+(crVal>=4.5?"✅":crVal>=3?"⚠️":"❌")))
              ),
              React.createElement("div",{style:{padding:10}},
                React.createElement("button",{onClick:function(){if(activeLayerObj){
                  saveHistory();
                  removeLayerFromBoard(activeBoard, activeEl);
                }},style:{width:"100%",padding:"8px 10px",border:"1px solid "+MD.dangerSoft,borderRadius:12,background:MD.dangerSoft,color:MD.danger,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}},"이 보드에서 레이어 삭제")
              )
            )
          : (!activeBoard ? React.createElement("div",{style:{padding:16,color:"#333",fontSize:11,textAlign:"center",marginTop:20}},"아트보드나 요소를 클릭하세요") : null),
        React.createElement("div",{style:{padding:8,borderTop:"1px solid #1a1a1a",marginTop:"auto",fontSize:9,color:"#333",lineHeight:1.8}},
          React.createElement("div",null,"🖱 스크롤: 줌 | Space+드래그: 패닝"),
          React.createElement("div",null,"단축키: Ctrl+Z (실행취소)"),
          React.createElement("div",null,"사이즈 ",React.createElement("span",{style:{color:"#888"}},visSizes.length)," | 레이어 ",React.createElement("span",{style:{color:"#888"}},layers.length))
        )
      )
    ),

    React.createElement("div",{style:{height:200,background:MD.surface,borderTop:"1px solid "+MD.line,display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"0 -4px 16px rgba(15,23,42,.04)"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"14px 16px 10px",borderBottom:"1px solid "+MD.line}},
        React.createElement("div",{style:{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:".08em",fontWeight:700}},"Asset Tray"),
        React.createElement("div",{style:{fontSize:11,color:MD.muted}},"썸네일 클릭 시 메인 비주얼 즉시 교체"),
        React.createElement("div",{style:{marginLeft:"auto",fontSize:11,color:assetLoading?MD.primary:MD.muted}},assetLoading?"불러오는 중...":assetMessage)
      ),
      React.createElement("div",{style:{display:"flex",gap:14,padding:"14px 16px",minHeight:0,flex:1}},
        React.createElement("div",{style:{width:260,display:"flex",flexDirection:"column",gap:8,flexShrink:0}},
          React.createElement("button",{onClick:function(){assetFileRef.current&&assetFileRef.current.click();},style:{padding:"8px 10px",borderRadius:4,border:"1px dashed #333",background:"#111",color:"#aaa",cursor:"pointer",fontSize:11,fontFamily:"inherit"}},"+ 로컬 에셋 추가"),
          React.createElement("input",{ref:assetFileRef,type:"file",accept:"image/*",multiple:true,onChange:function(e){handleAssetFiles(e.target.files);},style:{display:"none"}}),
          React.createElement("textarea",{value:assetUrlInput,onChange:function(e){setAssetUrlInput(e.target.value);},placeholder:"이미지 URL을 한 줄에 하나씩 붙여넣으세요",rows:5,style:{background:"#111",border:"1px solid #222",borderRadius:4,padding:"8px 10px",color:"#bbb",fontSize:11,fontFamily:"'JetBrains Mono',monospace",resize:"none",width:"100%",boxSizing:"border-box"}}),
          React.createElement("button",{onClick:importAssetUrls,disabled:assetLoading,style:{padding:"7px 10px",borderRadius:4,border:"none",background:assetLoading?"#222":"linear-gradient(135deg,#00d4ff,#0099cc)",color:assetLoading?"#555":"#001018",cursor:assetLoading?"default":"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}},"URL 에셋 불러오기")
        ),
        React.createElement("div",{style:{flex:1,minWidth:0,overflowX:"auto",overflowY:"hidden"}},
          assetLibrary.length===0
            ?React.createElement("div",{style:{height:"100%",minHeight:110,border:"1px dashed #222",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:12,textAlign:"center",padding:20}}, "에셋을 추가하면 이곳에 썸네일이 쌓입니다.")
            :React.createElement("div",{style:{display:"flex",gap:10,height:"100%"}},
                assetLibrary.map(function(asset){
                  var isActive = imgLayer && imgLayer.src===asset.src;
                  return React.createElement("div",{key:asset.id,style:{width:144,flexShrink:0,border:isActive?"1px solid #00d4ff":"1px solid #222",borderRadius:6,background:isActive?"rgba(0,212,255,.06)":"#111",overflow:"hidden",display:"flex",flexDirection:"column"}},
                    React.createElement("button",{onClick:function(){applyAsset(asset);},style:{border:"none",padding:0,background:"transparent",cursor:"pointer",textAlign:"left",color:"inherit"}},
                      React.createElement("div",{style:{height:96,background:"#0a0a0a"}},React.createElement("img",{src:asset.src,alt:asset.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})),
                      React.createElement("div",{style:{padding:"8px 9px 6px"}},
                        React.createElement("div",{style:{fontSize:10,color:isActive?"#00d4ff":"#ccc",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},asset.name),
                        React.createElement("div",{style:{fontSize:9,color:"#555",marginTop:3}},(asset.w||0)+"×"+(asset.h||0)+" · "+asset.origin)
                      )
                    ),
                    React.createElement("div",{style:{display:"flex",gap:6,padding:"0 9px 8px"}},
                      React.createElement("button",{onClick:function(){applyAsset(asset);},style:{flex:1,padding:"5px 0",border:"none",borderRadius:4,background:isActive?"rgba(0,212,255,.12)":"#171717",color:isActive?"#00d4ff":"#999",cursor:"pointer",fontSize:10,fontFamily:"inherit"}},isActive?"적용됨":"적용"),
                      React.createElement("button",{onClick:function(){removeAsset(asset.id);},style:{padding:"5px 8px",border:"1px solid #2a1515",borderRadius:4,background:"transparent",color:"#a55",cursor:"pointer",fontSize:10,fontFamily:"inherit"}},"삭제")
                    )
                  );
                })
              )
        )
      )
    )
  );
}

