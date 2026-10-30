import { createRoot } from 'react-dom/client';
import { PerjadinSheetView } from './components/PerjadinSheetView';
import type { PerjadinReportItem } from './perjadinTypes';

/** Isolated print document: application chrome and preview zoom never enter the print tree. */
export async function printReports(reports: {item:PerjadinReportItem;imageSrc:string}[]) {
 const frame=document.createElement('iframe');
 frame.title='Cetak laporan terpilih';
 frame.style.cssText='position:fixed;left:-20000px;top:0;width:794px;height:1123px;border:0';
 document.body.append(frame);
 const doc=frame.contentDocument,win=frame.contentWindow;
 if(!doc||!win){frame.remove();throw new Error('Jendela cetak tidak dapat dibuka.');}
 doc.title=`Laper — ${reports.length} laporan terpilih`;
 const root=createRoot(doc.body.appendChild(doc.createElement('div')));
 const cleanup=()=>{root.unmount();frame.remove();};
 try {
  const styles=Array.from(document.querySelectorAll('link[rel="stylesheet"],style')).map(node=>{
   const clone=node.cloneNode(true) as HTMLElement;
   doc.head.append(clone);
   return clone.tagName === 'LINK'?new Promise<void>((resolve,reject)=>{clone.addEventListener('load',()=>resolve(),{once:true});clone.addEventListener('error',()=>reject(new Error('Gaya cetak gagal dimuat.')),{once:true});}):Promise.resolve();
  });
  await Promise.all(styles);
  const override=doc.createElement('style');override.textContent='@page{size:A4 portrait;margin:0}html,body{margin:0!important;padding:0!important;background:white!important}body>*{visibility:visible!important}.a4-pages{gap:0!important}.print-report{break-after:page}.print-report:last-child{break-after:auto}.a4-page{break-after:page}.print-report:last-child .a4-page:last-child{break-after:auto}.a4-measure{visibility:hidden!important}@media print{.a4-measure{display:none!important}}';doc.head.append(override);
  // Load document fonts before measuring pagination.
  await doc.fonts.ready;
  await new Promise<void>(resolve=>{
   const ready=new Set<string>();
   root.render(<>{reports.map(({item,imageSrc})=><section className="print-report" key={item.id}><PerjadinSheetView item={item} imageSrc={imageSrc} onPageCount={()=>{ready.add(item.id);if(ready.size===reports.length)resolve();}}/></section>)}</>);
  });
  await Promise.all(Array.from(doc.images).map(image=>image.decode().catch(()=>{throw new Error('Foto cetak gagal dimuat.');})));
  await new Promise<void>(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>resolve())));
  win.addEventListener('afterprint',cleanup,{once:true});
  win.focus();win.print();
 } catch(error){cleanup();throw error;}
}
