import { useLayoutEffect, useRef } from 'react';
import type { PerjadinReportItem } from '../perjadinTypes';
interface Props { item: PerjadinReportItem; imageSrc?: string|null; className?: string; isPrintOnly?: boolean; forceTwoPages?: boolean; onPageCount?: (count:number)=>void }
/** Paginate measured browser content into physical A4 sheets, without clipping prose. */
export function PerjadinSheetView({item,imageSrc,className='',onPageCount}:Props) {
 const source=useRef<HTMLDivElement>(null), output=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  if(!source.current||!output.current)return;
  const host=output.current;host.replaceChildren();let count=0;
  const newPage=()=>{const page=document.createElement('div');page.className='a4-page';const body=document.createElement('div');body.className='a4-content';page.append(body);host.append(page);count++;return body;};
  let body=newPage();
  const fits=()=>body.scrollHeight<=body.clientHeight+1;
  for(const original of Array.from(source.current.children)) {
   const node=original.cloneNode(true) as HTMLElement;body.append(node);
   if(fits())continue;
   node.remove();
   if(original.hasAttribute('data-split')) {
    let words=(original.textContent||'').split(/\s+/);
    while(words.length){let lo=0,hi=words.length;const part=original.cloneNode(false) as HTMLElement;body.append(part);
     while(lo<hi){const mid=Math.ceil((lo+hi)/2);part.textContent=words.slice(0,mid).join(' ');if(fits())lo=mid;else hi=mid-1;}
     if(!lo){part.remove();body=newPage();continue;}
     part.textContent=words.slice(0,lo).join(' ');words=words.slice(lo);if(words.length)body=newPage();
    }
   }else{body=newPage();body.append(node);}
  }
  onPageCount?.(count);
 },[item,imageSrc,onPageCount]);
 const opening=item.nomorST?.trim()?`Berdasarkan surat tugas nomor ${item.nomorST}${item.tanggalST?` tanggal ${item.tanggalST}`:''} bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`:`Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`;
 return <div className={className}><div className="a4-measure" aria-hidden="true"><div ref={source} className="a4-content">
 <h2 className="a4-title">LAPORAN PERJALANAN DINAS</h2>
 <div className="a4-header"><span>Perihal : Laporan Perjalanan Dinas {item.namaKegiatan}</span><span>{item.tanggalSurat}</span></div>
 <p>Kepada Yang Terhormat:<br/>Kepala BPS Kabupaten Lombok Tengah<br/>di<br/>Tempat</p>
 <p data-split>{opening}</p>
 <table><tbody>{[['Nama',item.nama],['Jabatan',item.jabatan],['Asal Satker',item.asalSatker],['Tujuan perjalanan',item.tujuan],['Hari, Tanggal',item.hariTanggal],['Uraian kegiatan perjalanan dinas','']].map(([label,value],i)=><tr key={label}><td>{i+1}.</td><td>{label}</td><td>:</td><td>{value||''}</td></tr>)}</tbody></table>
 <p data-split className="a4-narrative">{item.uraian||'[Uraian kegiatan belum diisi]'}</p>
 <div className="a4-documentation"><p>7. Dokumentasi</p>{imageSrc?<img src={imageSrc} alt="Dokumentasi perjadin berstempel" style={{height:item.photoTargetHeight||185}}/>:<p>[Foto dokumentasi belum tersedia]</p>}</div>
 <div className="a4-signature">Pelaksana perjalanan dinas<div style={{height:64}}/>{item.nama||'(Nama Pegawai)'}</div>
 </div></div><div ref={output} className="a4-pages"/></div>;
}
