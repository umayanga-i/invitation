'use client';
import { useEffect,useState } from 'react';
export function useAdminDemo(){const [enabled,setEnabled]=useState(false);useEffect(()=>{const sync=()=>setEnabled(localStorage.getItem('admin:demo')==='1');sync();window.addEventListener('admin-demo-change',sync);return()=>window.removeEventListener('admin-demo-change',sync)},[]);return [enabled,(value:boolean)=>{localStorage.setItem('admin:demo',value?'1':'0');window.dispatchEvent(new Event('admin-demo-change'))}] as const;}
