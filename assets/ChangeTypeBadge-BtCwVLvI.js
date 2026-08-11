import{c as l,j as o,T as C,_ as w,v as T,h as s}from"./index-Cn-5qhoF.js";import{B as b}from"./badge-Cto-VTIv.js";import{b as j,H as y,F as k,C as A,a as I,U as M,g as N}from"./inventory-change-types-DFykoAKW.js";import{S as v}from"./settings-BO06NMZI.js";import{T as _}from"./trash-2-DratFXC5.js";import{C as $}from"./circle-x-K0Uv6ec5.js";import{T as D}from"./triangle-alert-BMZY8LNo.js";import{T as R}from"./trending-down-CuYllwC6.js";import{R as U}from"./rotate-ccw-C1qQVxoN.js";/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],B=l("arrow-down",z);/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],P=l("arrow-up",F);/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M5 12h14",key:"1ays0h"}]],S=l("minus",H),X={Package:T,Truck:w,Undo2:M,RotateCcw:U,TrendingUp:C,TrendingDown:R,AlertTriangle:D,XCircle:$,Trash2:_,Settings:v,PlusCircle:I,MinusCircle:A,FileCheck:k,Hammer:y},q={up:P,down:B,neutral:S},E=({type:a,quantity:i,weight:n,showDirection:p=!1,showAmount:m=!1,size:d="md",className:g})=>{const e=N(a),t=j(a),h=X[e.icon],u=q[e.direction],r={sm:{badge:"text-xs px-2 py-0.5 h-5",icon:"w-3 h-3",directionIcon:"w-3 h-3",amount:"text-xs"},md:{badge:"text-sm px-2.5 py-1 h-7",icon:"w-4 h-4",directionIcon:"w-3.5 h-3.5",amount:"text-sm"},lg:{badge:"text-base px-3 py-1.5 h-9",icon:"w-5 h-5",directionIcon:"w-4 h-4",amount:"text-base"}}[d],x=(()=>{if(!m)return null;const c=[];if(i!==void 0){const f=e.direction==="up"?"+":e.direction==="down"?"-":"";c.push(`${f}${Math.abs(i)} 件`)}return n!==void 0&&n>0&&c.push(`${n.toFixed(2)} kg`),c.length>0?c.join(" / "):null})();return o.jsxs("div",{className:s("flex items-center gap-2",g),children:[o.jsx(b,{variant:"outline",className:s(r.badge,"font-medium border",t.bg,t.text,t.border,e.isRollback&&"border-dashed"),children:o.jsxs("span",{className:"flex items-center gap-1.5",children:[h&&o.jsx(h,{className:s(r.icon,t.icon)}),o.jsx("span",{children:e.label}),p&&u&&o.jsx(u,{className:s(r.directionIcon,t.directionIcon,"ml-0.5")})]})}),x&&o.jsx("span",{className:s(r.amount,"font-medium",e.direction==="up"&&"text-emerald-600",e.direction==="down"&&"text-rose-600",e.direction==="neutral"&&"text-slate-600"),children:x})]})},oe=({type:a,quantity:i,weight:n,unit:p="件",size:m="md",className:d})=>o.jsx(E,{type:a,quantity:i,weight:n,showDirection:!0,showAmount:!0,size:m,className:d});export{P as A,oe as C,B as a,E as b};
