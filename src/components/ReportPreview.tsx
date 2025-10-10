
export default function ReportPreview({data}:{data:any}) {
  if (!data) return null;
  return (
    <div className="card" style={{marginTop:16}}>
      <div style={{fontWeight:700, marginBottom:10}}>Preview</div>
      <div style={{display:'grid', gap:12}}>
        <div>
          <div style={{fontWeight:600}}>Findings</div>
          <pre>{JSON.stringify(data.findings, null, 2)}</pre>
        </div>
        <div>
          <div style={{fontWeight:600}}>Code Citations</div>
          <pre>{JSON.stringify(data.code_citations, null, 2)}</pre>
        </div>
        <div>
          <div style={{fontWeight:600}}>Supplement Letter (Draft)</div>
          <pre>{String(data.supplement_letter || "")}</pre>
        </div>
      </div>
    </div>
  );
}
