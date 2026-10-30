import { useEffect, useRef, useState } from 'react';
import { PerjadinSheetView } from './PerjadinSheetView';
import type { PerjadinReportItem } from '../perjadinTypes';
export function PerjadinA4Preview({item,imageSrc}:{item:PerjadinReportItem;imageSrc?:string|null}) {
 const viewport=useRef<HTMLDivElement>(null);
 const [pages,setPages]=useState(1),[fit,setFit]=useState(true),[zoom,setZoom]=useState(1);
 const width=210*96/25.4,height=297*96/25.4;
 useEffect(()=>{const el=viewport.current;if(!el)return;const resize=()=>{if(fit)setZoom(Math.min(1,(el.clientWidth-32)/width,(el.clientHeight-32)/(height*pages+24*(pages-1))));};const observer=new ResizeObserver(resize);observer.observe(el);resize();return()=>observer.disconnect();},[fit,pages]);
 return <div className="a4-viewer"><div className="a4-controls"><span>{pages} halaman · A4</span><button aria-label="Perkecil preview" onClick={()=>{setFit(false);setZoom(z=>Math.max(.1,z-.1));}}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Perbesar preview" onClick={()=>{setFit(false);setZoom(z=>Math.min(2,z+.1));}}>+</button><button aria-pressed={fit} onClick={()=>setFit(true)}>Fit to box</button></div><div className="a4-viewport" ref={viewport}><div style={{width:width*zoom,height:(height*pages+24*(pages-1))*zoom,margin:'0 auto'}}><div style={{width,transform:`scale(${zoom})`,transformOrigin:'top left'}}><PerjadinSheetView item={item} imageSrc={imageSrc} onPageCount={setPages}/></div></div></div></div>;
}
