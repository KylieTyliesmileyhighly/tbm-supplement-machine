
import { useState } from "react";

export type ClaimData = {
  insured?: string; claim?: string; dol?: string; cause?: string; address?: string;
};

export default function ClaimForm({ onChange }: { onChange: (d: ClaimData)=>void }) {
  const [d, setD] = useState<ClaimData>({});

  function set<K extends keyof ClaimData>(k: K, v: string) {
    const nd = {...d, [k]: v}; setD(nd); onChange(nd);
  }

  return (
    <div className="card" style={{marginTop:16}}>
      <div style={{fontWeight:700, marginBottom:10}}>Claim Details</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <input className="input" placeholder="Insured name" onChange={(e)=>set('insured', e.target.value)} />
        <input className="input" placeholder="Claim #" onChange={(e)=>set('claim', e.target.value)} />
        <input className="input" placeholder="Date of Loss (MM/DD/YYYY)" onChange={(e)=>set('dol', e.target.value)} />
        <input className="input" placeholder="Cause of loss (Wind/Hail/Water/etc.)" onChange={(e)=>set('cause', e.target.value)} />
        <input className="input" placeholder="Property address" onChange={(e)=>set('address', e.target.value)} />
      </div>
    </div>
  );
}
