
import { useState } from "react";

export default function FileUploader({ onFiles }: { onFiles: (f: File[])=>void }) {
  const [files, setFiles] = useState<File[]>([]);
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const arr = Array.from(e.target.files || []);
    setFiles(arr); onFiles(arr);
  }
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:10}}>Upload Files</div>
      <p className="small">Upload the carrier estimate (PDF/DOCX). Optionally add your TBM estimate or photos.</p>
      <input className="file" type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handle}/>
      <ul className="list">
        {files.map((f,i)=><li key={i}>{f.name} — {(f.size/1024/1024).toFixed(2)} MB</li>)}
      </ul>
    </div>
  );
}
