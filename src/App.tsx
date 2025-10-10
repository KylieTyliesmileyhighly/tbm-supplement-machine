
import { useEffect, useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ClaimForm, { ClaimData } from "./components/ClaimForm";
import ReportPreview from "./components/ReportPreview";
import "./styles.css";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [claim, setClaim] = useState<ClaimData>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ document.title = import.meta.env.VITE_APP_NAME || "TBM Supplementing Machine"; }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const ok = await fetch("/api/analyze-estimate", {
      method: "POST",
      headers: { "X-TBM-Auth": btoa(`${u}:${p}`) }
    });
    setAuthed(ok.status === 204);
  }

  async function generate() {
    setLoading(true);
    const fd = new FormData();
    files.forEach((f)=>fd.append("files", f));
    Object.entries(claim).forEach(([k,v])=> fd.append(k, String(v||"")));
    const res = await fetch("/api/analyze-estimate", {
      method:"POST",
      headers: { "X-TBM-Auth": btoa(`${u}:${p}`) },
      body: fd
    });
    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  async function downloadPDF() {
    const res = await fetch("/api/generate-report", {
      method:"POST",
      headers: {"Content-Type":"application/json","X-TBM-Auth": btoa(`${u}:${p}`)},
      body: JSON.stringify(result)
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `TBM_Supplement_${(claim.claim||"claim").replace(/\s+/g,"")}.pdf`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <>
        <Header/>
        <div className="container">
          <form className="card" onSubmit={login}>
            <div style={{fontWeight:700, marginBottom:10}}>TBM Internal Login</div>
            <input className="input" placeholder="User" value={u} onChange={e=>setU(e.target.value)} />
            <div style={{height:8}}/>
            <input className="input" placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)} />
            <div style={{height:12}}/>
            <button className="btn" type="submit">Enter</button>
            <div className="small" style={{marginTop:10}}>Access restricted to TBM staff and approved partners.</div>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Header/>
      <div className="container">
        <FileUploader onFiles={setFiles}/>
        <ClaimForm onChange={setClaim}/>
        <div style={{height:12}}/>
        <button className="btn" onClick={generate} disabled={loading || files.length===0}>
          {loading ? "Analyzing…" : "Generate Supplement"}
        </button>
        {result && (
          <>
            <ReportPreview data={result}/>
            <div style={{marginTop:12}}>
              <button className="btn" onClick={downloadPDF}>Download PDF</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
