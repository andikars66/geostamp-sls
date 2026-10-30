import {useCallback,useEffect,useState} from 'react';
export type NoticeTone='success'|'warning'|'error';
/** A new notification, even with the same text, starts a fresh three-second timeout. */
export function useNotice(){
 const [notice,setNotice]=useState<{text:string;tone:NoticeTone}|null>(null);
 const setMessage=useCallback((text:string|null,tone:NoticeTone='success')=>setNotice(text?{text,tone}:null),[]);
 const restart=useCallback(()=>setNotice(current=>current?{...current}:null),[]);
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(null),3000);return()=>window.clearTimeout(timer);},[notice]);
 return {message:notice?.text||'',tone:notice?.tone||'success',setMessage,restart};
}
