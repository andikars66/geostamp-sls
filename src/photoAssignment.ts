import type { BulkPhotoItem } from './types';
const nameKey=(name:string)=>name.trim().toLowerCase().replace(/\.[^/.]+$/,'');
/** Reserve filename matches first; the active visit is a one-use fallback per upload. */
export function assignPhotos(visits:BulkPhotoItem[],photos:BulkPhotoItem[],activeId?:string){
 const updated=[...visits],used=new Set<number>();
 const assignments=photos.map(photo=>{
  const index=visits.findIndex((visit,i)=>!used.has(i)&&[visit.expectedFileName,visit.fileName].some(name=>!!name&&nameKey(name)===nameKey(photo.fileName)));
  if(index>=0)used.add(index);return index;
 });
 const replacedUrls:string[]=[];
 photos.forEach((photo,i)=>{
  let index=assignments[i];
  if(index<0&&activeId){const active=visits.findIndex(v=>v.id===activeId);if(active>=0&&!used.has(active)&&visits[active].photoMissing){index=active;used.add(active);}}
  if(index<0){updated.push(photo);return;}
  const previous=updated[index];if(previous.thumbUrl)replacedUrls.push(previous.thumbUrl);
  updated[index]={...previous,file:photo.file,fileName:photo.fileName,thumbUrl:photo.thumbUrl,width:photo.width,height:photo.height,photoMissing:false};
 });
 return {items:updated,replacedUrls};
}
