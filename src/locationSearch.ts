import type { HierarchyPayload, ResolvedLocationTarget, BulkPhotoItem } from './types';
export interface LocationOption { id:string; label:string; sublabel:string; searchText:string; level:'kecamatan'|'desa'|'sls'|'subsls'; name:string; kdkec:string; iddesa?:string; idsls?:string; target:ResolvedLocationTarget; children:number }
const clean=(s:string)=>s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const bare=(s:string)=>clean(s).replace(/^(dusun|sls|desa|kelurahan|kecamatan|kec|sub sls|subsls)\s+/,'');
export function buildLocationOptions(h:HierarchyPayload|null):LocationOption[]{
 if(!h)return [];const out:LocationOption[]=[];
 const add=(level:LocationOption['level'],code:string,name:string,t:ResolvedLocationTarget,context:string,children=0)=>out.push({id:`${level}:${code}`,level,name:bare(name),label:name,sublabel:`${context} · ${code}`,searchText:clean(`${name} ${context} ${code}`),kdkec:t.kdkec,iddesa:t.iddesa,idsls:t.idsls,target:t,children});
 for(const k of h.kecamatan){const kt:ResolvedLocationTarget={level:'kecamatan',status:'partial',kdkec:k.kdkec,nmkec:k.nmkec,displayLabel:`Kecamatan ${k.nmkec}`};add('kecamatan',k.kdkec,kt.displayLabel,kt,'Kecamatan',k.desa.length);
 for(const d of k.desa){const dt:ResolvedLocationTarget={...kt,level:'desa',iddesa:d.iddesa,nmdesa:d.nmdesa,displayLabel:`Desa ${d.nmdesa}, Kecamatan ${k.nmkec}`};add('desa',d.iddesa,`Desa ${d.nmdesa}`,dt,`Kecamatan ${k.nmkec}`,d.sls.length);
 for(const s of d.sls){const st:ResolvedLocationTarget={...dt,level:'sls',status:'matched',idsls:s.idsls,nmsls:s.nmsls,displayLabel:`${s.nmsls}, Desa ${d.nmdesa}, Kecamatan ${k.nmkec}`};add('sls',s.idsls,s.nmsls,st,`Desa ${d.nmdesa} · Kecamatan ${k.nmkec}`,s.subsls.length);
 for(const sub of s.subsls){const t:ResolvedLocationTarget={...st,level:'subsls',idsubsls:sub.idsubsls,kdsubsls:sub.kdsubsls,displayLabel:st.displayLabel};add('subsls',sub.idsubsls,`SubSLS ${sub.kdsubsls} · ${s.nmsls}`,t,`Desa ${d.nmdesa} · Kecamatan ${k.nmkec}`);}
 }}}
 return out;
}
function distance(a:string,b:string){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1)));row=next;}return row[b.length];}
export function searchLocations(query:string,options:LocationOption[],scope?:LocationOption){
 const q=clean(query.replace(/\bkec\.?\s/gi,'kecamatan '));
 const segments=[...q.matchAll(/\b(kecamatan|desa|kelurahan|dusun|sls|subsls)\s+(.+?)(?=\s+(?:kecamatan|desa|kelurahan|dusun|sls|subsls)\s|$)/g)];
 const levelMap:Record<string,LocationOption['level']>={kecamatan:'kecamatan',desa:'desa',kelurahan:'desa',dusun:'sls',sls:'sls',subsls:'subsls'};
 const leading=segments[0]?q.slice(0,segments[0].index).trim():'';
 const wanted=leading?'sls':segments[0]?levelMap[segments[0][1]]:undefined;
 const tokens=q.split(' ').filter(x=>x&&!['kecamatan','desa','kelurahan','dusun','sls','subsls'].includes(x));
 const candidates=options.filter(o=>{
 if(scope){if(scope.level==='kecamatan'&&(o.kdkec!==scope.kdkec||o.level!=='desa'&&o.level!=='sls'))return false;if(scope.level==='desa'&&(o.iddesa!==scope.iddesa||o.level!=='sls'))return false;if(scope.level==='sls'&&(o.idsls!==scope.idsls||o.level!=='subsls'))return false;}
 if(wanted&&o.level!==wanted)return false;if(!wanted&&!scope&&o.level==='subsls'&&!/^\d+$/.test(q))return false;
 return segments.every((seg,i)=>{if(i===0&&!leading)return true;const level=levelMap[seg[1]];const name=level==='kecamatan'?o.target.nmkec:level==='desa'?o.target.nmdesa:o.target.nmsls;return !!name&&bare(name).includes(seg[2]);});
 });
 const exact=candidates.filter(o=>tokens.every(t=>o.searchText.includes(t))).map(o=>({o,score:(o.id.split(':')[1]===q?1000:0)+(o.name===(segments[0]?.[2]||q)?100:0)+(o.name.startsWith(segments[0]?.[2]||q)?30:0)})).sort((a,b)=>b.score-a.score||a.o.label.localeCompare(b.o.label,'id'));
 if(exact.length)return {options:exact.map(x=>x.o),suggestion:false};
 const name=segments[0]?.[2]||q;
 return {options:name.length>=4?candidates.filter(o=>distance(o.name,name)<=Math.max(1,Math.floor(name.length/5))).slice(0,8):[],suggestion:true};
}
export function resolveLocation(query:string,options:LocationOption[]):ResolvedLocationTarget{
 const direct=options.find(o=>o.id===query||o.id.split(':')[1]===query.trim());if(direct)return direct.target;
 const result=searchLocations(query,options);const exact=result.options.filter(o=>o.name===bare(query)||o.name===(clean(query).match(/^(?:desa|kecamatan|dusun|sls|kelurahan)\s+(.+?)(?=\s+(?:desa|kecamatan)\s|$)/)?.[1]));
 if(!result.suggestion&&exact.length===1)return exact[0].target;
 return {status:query.trim()?'unmatched':'empty',level:'none',kdkec:'',nmkec:'',displayLabel:result.options.length?'Pilih wilayah dari daftar':'Wilayah tidak ditemukan'};
}
export function destination(item:BulkPhotoItem){if(item.tujuanPerjadin!==undefined)return item.tujuanPerjadin;return item.resolvedTarget?.level!=='none'?item.resolvedTarget?.displayLabel||'':'';}
