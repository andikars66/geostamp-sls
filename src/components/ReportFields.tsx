import { CalendarDays, Clock3, ChevronDown } from 'lucide-react';
import {useState,useEffect,useRef} from 'react';
import {toIsoDateValue,toIsoTimeValue} from '../spatial';
export function DateTimeField({kind,label,value,onChange}:{kind:'date'|'time';label:string;value:string;onChange:(v:string)=>void}){
 const picker=useRef<HTMLInputElement>(null);
 return <label>{label}<div className="typed-picker"><input aria-label={label} type="text" value={value} placeholder={kind==='date'?'YYYY-MM-DD atau DD/MM/YYYY':'HH:MM:SS'} onChange={e=>onChange(e.target.value)}/><button type="button" aria-label={kind==='date'?'Pilih tanggal dari kalender':'Pilih waktu dari jam'} onClick={()=>{try{picker.current?.showPicker();}catch{picker.current?.focus();}}}>{kind==='date'?<CalendarDays size={16}/>:<Clock3 size={16}/>}</button><input ref={picker} aria-label={`${label} picker`} type={kind} step={kind==='time'?1:undefined} value={kind==='date'?toIsoDateValue(value):toIsoTimeValue(value)} onChange={e=>onChange(e.target.value)}/></div></label>;
}
export function DayField({value,onChange}:{value:string;onChange:(v:string)=>void}) {
 const [open,setOpen]=useState(false);
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const dismiss=(event:Event)=>{if(event.target instanceof Node&&!container.current?.contains(event.target))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',dismiss,true);
  document.addEventListener('focusin',dismiss);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('focusin',dismiss);document.removeEventListener('keydown',escape);};
 },[open]);
 return <div ref={container} className="day-field"><label>Hari<div className="typed-picker"><input aria-label="Hari" value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}/><button type="button" aria-label="Pilih hari" aria-expanded={open} onClick={()=>setOpen(!open)}><ChevronDown size={16}/></button></div></label>{open&&<div className="day-options">{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(day=><button key={day} type="button" onClick={()=>{onChange(day);setOpen(false);}}>{day}</button>)}</div>}</div>;
}
export type { LocationOption } from '../locationSearch';
import { searchLocations, type LocationOption } from '../locationSearch';
export function LocationField({value,options,onChange}:{value:string;options:LocationOption[];onChange:(v:string)=>void}) {
 const selected=options.find(o=>o.id===value||o.id.split(':')[1]===value);
 const display=selected?selected.target.displayLabel:value;
 const [text,setText]=useState(display),[open,setOpen]=useState(false),[index,setIndex]=useState(-1),[limit,setLimit]=useState(12);
 const [scope,setScope]=useState<LocationOption>();
 useEffect(()=>{setText(display);},[display]);
 const result=searchLocations(text,options,scope),matches=result.options.slice(0,limit);
 const choose=(o:LocationOption)=>{onChange(o.id);setText(o.target.displayLabel);setOpen(false);setScope(undefined);};
 return <div className="location-field">
 {scope&&<div className="location-scope">Dalam {scope.label}<button type="button" onClick={()=>{setScope(undefined);setText('');setOpen(true);}}>Hapus filter</button></div>}
 <label>Lokasi<input role="combobox" aria-expanded={open} aria-controls="location-results" aria-autocomplete="list" aria-activedescendant={index>=0?`location-option-${index}`:undefined} value={text} placeholder="Nama wilayah, konteks desa/kecamatan, atau ID" onFocus={()=>setOpen(true)} onChange={e=>{setText(e.target.value);setOpen(true);setIndex(-1);setLimit(12);}} onBlur={e=>{if(!e.currentTarget.parentElement?.parentElement?.contains(e.relatedTarget)){setOpen(false);if(text!==display)onChange(text);}}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setIndex(i=>Math.min(i+1,matches.length-1));}if(e.key==='ArrowUp'){e.preventDefault();setIndex(i=>Math.max(0,i-1));}if(e.key==='Escape')setOpen(false);if(e.key==='Enter'){e.preventDefault();if(index>=0&&matches[index])choose(matches[index]);else setOpen(true);}}}/></label>
 {open&&(text||scope)&&<div id="location-results" role="listbox" className="location-results"><p className="location-count">{result.suggestion?'Saran nama — pilih untuk memastikan wilayah':`${result.options.length} wilayah ditemukan`}</p>{matches.map((o,i)=><div key={o.id} className="location-result"><button type="button" role="option" aria-selected={i===index} id={`location-option-${i}`} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(o)}>{o.label}<small>{o.sublabel}</small><small>{o.level==='sls'?`${o.children} SubSLS`:o.level==='desa'?'Desa / kelurahan':o.level==='kecamatan'?'Kecamatan':'SubSLS'}</small></button>{o.children>0&&o.level!=='subsls'&&<button type="button" className="browse-location" onMouseDown={e=>e.preventDefault()} onClick={()=>{setScope(o);setText('');setIndex(-1);setLimit(12);setOpen(true);}}>{o.level==='sls'?'Lihat SubSLS':o.level==='desa'?'Lihat SLS':'Lihat desa / SLS'} →</button>}</div>)}{!matches.length&&<p>Wilayah belum ditemukan. Periksa tingkat wilayah atau tambahkan konteks desa/kecamatan.</p>}{result.options.length>limit&&<button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>setLimit(n=>n+24)}>Lihat hasil lainnya ({result.options.length-limit})</button>}</div>}
 </div>;
}
