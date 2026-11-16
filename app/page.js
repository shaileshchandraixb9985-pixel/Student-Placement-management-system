"use client";
import { useState } from "react";
import { useDB } from "@/lib/store";
import { Student, Recruiter, uid, BRANCHES, STATUSES } from "@/lib/models";

const TABS = [
  ["students", "Student profile"],
  ["drives", "Company and drives"],
  ["eligibility", "Eligibility check"],
  ["applications", "Application and selection"],
  ["report", "Placement report"],
];
const TITLES = {
  students: ["Students", "Add and manage student profiles."],
  drives: ["Companies and drives", "Record the companies visiting campus and the drives they run."],
  eligibility: ["Eligibility check", "See whether a student meets a drive's criteria, and why not."],
  applications: ["Applications and selection", "Apply eligible students and track each result."],
  report: ["Placement report", "Results so far across students and companies."],
};

async function runCheck(student, drive) {
  const res = await fetch("/api/eligibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student, drive }),
  });
  if (!res.ok) throw new Error("Eligibility check failed. Try again.");
  return res.json();
}

const F = ({ label, children }) => <label>{label}{children}</label>;
const Empty = ({ children }) => <p className="empty">{children}</p>;

export default function Page() {
  const [db, update, reset] = useDB();
  const [tab, setTab] = useState("students");
  const [toast, setToast] = useState(null);
  const say = (t, kind = "ok") => {
    setToast({ t, kind });
    setTimeout(() => setToast(null), 3200);
  };
  if (!db) return <div className="boot">Loading…</div>;
  const props = { db, update, say };
  const [title, sub] = TITLES[tab];
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Placement Management<small>CSE2003 · Group 12</small></div>
        <nav className="nav" aria-label="Modules">
          {TABS.map(([id, name], i) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)} aria-current={tab === id}>
              <span>{i + 1}</span>{name}
            </button>
          ))}
        </nav>
        <div className="grow" />
        <button className="btn ghost" onClick={() => { reset(); say("Sample data restored."); }}>Reset sample data</button>
      </aside>
      <main className="main">
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
        {tab === "students" && <Students {...props} />}
        {tab === "drives" && <Drives {...props} />}
        {tab === "eligibility" && <Eligibility {...props} />}
        {tab === "applications" && <Applications {...props} />}
        {tab === "report" && <Report {...props} />}
      </main>
      {toast && <div className={`toast ${toast.kind}`} role="status">{toast.t}</div>}
    </div>
  );
}

function Students({ db, update, say }) {
  const blank = { name: "", email: "", branch: BRANCHES[0], cgpa: "", backlogs: 0 };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = (e) => {
    e.preventDefault();
    try {
      const s = { ...new Student({ id: uid(), ...f }) };
      update((d) => { d.students.push(s); return d; });
      setF(blank);
      say("Student added.");
    } catch (err) { say(err.message, "bad"); }
  };
  const del = (id) => {
    update((d) => {
      d.students = d.students.filter((s) => s.id !== id);
      d.applications = d.applications.filter((a) => a.studentId !== id);
      return d;
    });
    say("Student removed.");
  };
  return (
    <>
      <form className="card" onSubmit={add}>
        <h2>Add a student</h2>
        <div className="grid">
          <F label="Full name"><input value={f.name} onChange={set("name")} required /></F>
          <F label="Email"><input type="email" value={f.email} onChange={set("email")} required /></F>
          <F label="Branch"><select value={f.branch} onChange={set("branch")}>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select></F>
          <F label="CGPA"><input type="number" step="0.01" min="0" max="10" value={f.cgpa} onChange={set("cgpa")} required /></F>
          <F label="Backlogs"><input type="number" min="0" value={f.backlogs} onChange={set("backlogs")} /></F>
          <button className="btn">Add student</button>
        </div>
      </form>
      <div className="card tw">
        {db.students.length === 0 ? <Empty>No students yet. Add the first one above.</Empty> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th><th>Backlogs</th><th /></tr></thead>
            <tbody>{db.students.map((s) => (
              <tr key={s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.branch}</td><td>{s.cgpa}</td><td>{s.backlogs}</td>
                <td><button className="btn link" onClick={() => del(s.id)}>Remove</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Drives({ db, update, say }) {
  const cBlank = { name: "", sector: "", recruiter: "", recruiterEmail: "" };
  const dBlank = { companyId: "", role: "", ctc: "", minCgpa: 6, maxBacklogs: 0, branches: [], date: "" };
  const [c, setC] = useState(cBlank);
  const [d, setD] = useState(dBlank);
  const cname = (id) => db.companies.find((x) => x.id === id)?.name || "Unknown";
  const addCompany = (e) => {
    e.preventDefault();
    try {
      const r = new Recruiter({ id: uid(), name: c.recruiter, email: c.recruiterEmail });
      update((x) => { x.companies.push({ id: uid(), name: c.name.trim(), sector: c.sector.trim(), recruiter: r.name, recruiterEmail: r.email }); return x; });
      setC(cBlank);
      say("Company added.");
    } catch (err) { say(err.message, "bad"); }
  };
  const addDrive = (e) => {
    e.preventDefault();
    if (!d.companyId) return say("Choose a company first.", "bad");
    if (!d.branches.length) return say("Pick at least one eligible branch.", "bad");
    update((x) => { x.drives.push({ id: uid(), ...d, ctc: Number(d.ctc), minCgpa: Number(d.minCgpa), maxBacklogs: Number(d.maxBacklogs) }); return x; });
    setD(dBlank);
    say("Drive added.");
  };
  const toggle = (b) => setD({ ...d, branches: d.branches.includes(b) ? d.branches.filter((x) => x !== b) : [...d.branches, b] });
  const delDrive = (id) => {
    update((x) => { x.drives = x.drives.filter((v) => v.id !== id); x.applications = x.applications.filter((a) => a.driveId !== id); return x; });
    say("Drive removed.");
  };
  const delCompany = (id) => {
    update((x) => {
      const gone = x.drives.filter((v) => v.companyId === id).map((v) => v.id);
      x.companies = x.companies.filter((v) => v.id !== id);
      x.drives = x.drives.filter((v) => v.companyId !== id);
      x.applications = x.applications.filter((a) => !gone.includes(a.driveId));
      return x;
    });
    say("Company removed with its drives.");
  };
  return (
    <>
      <form className="card" onSubmit={addCompany}>
        <h2>Add a company</h2>
        <div className="grid">
          <F label="Company"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required /></F>
          <F label="Sector"><input value={c.sector} onChange={(e) => setC({ ...c, sector: e.target.value })} required /></F>
          <F label="Recruiter name"><input value={c.recruiter} onChange={(e) => setC({ ...c, recruiter: e.target.value })} required /></F>
          <F label="Recruiter email"><input type="email" value={c.recruiterEmail} onChange={(e) => setC({ ...c, recruiterEmail: e.target.value })} required /></F>
          <button className="btn">Add company</button>
        </div>
      </form>
      <form className="card" onSubmit={addDrive}>
        <h2>Schedule a drive</h2>
        <div className="grid">
          <F label="Company"><select value={d.companyId} onChange={(e) => setD({ ...d, companyId: e.target.value })}><option value="">Select…</option>{db.companies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
          <F label="Role"><input value={d.role} onChange={(e) => setD({ ...d, role: e.target.value })} required /></F>
          <F label="Package (LPA)"><input type="number" step="0.1" min="0" value={d.ctc} onChange={(e) => setD({ ...d, ctc: e.target.value })} required /></F>
          <F label="Minimum CGPA"><input type="number" step="0.1" min="0" max="10" value={d.minCgpa} onChange={(e) => setD({ ...d, minCgpa: e.target.value })} required /></F>
          <F label="Max backlogs"><input type="number" min="0" value={d.maxBacklogs} onChange={(e) => setD({ ...d, maxBacklogs: e.target.value })} required /></F>
          <F label="Drive date"><input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} required /></F>
        </div>
        <p style={{ margin: "16px 0 8px", fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>Eligible branches</p>
        <div className="checks">{BRANCHES.map((b) => <label key={b}><input type="checkbox" checked={d.branches.includes(b)} onChange={() => toggle(b)} />{b}</label>)}</div>
        <p><button className="btn">Add drive</button></p>
      </form>
      <div className="card tw">
        <h2>Drives</h2>
        {db.drives.length === 0 ? <Empty>No drives scheduled yet.</Empty> : (
          <table>
            <thead><tr><th>Company</th><th>Role</th><th>LPA</th><th>Criteria</th><th>Date</th><th /></tr></thead>
            <tbody>{db.drives.map((v) => (
              <tr key={v.id}><td>{cname(v.companyId)}</td><td>{v.role}</td><td>{v.ctc}</td>
                <td>CGPA ≥ {v.minCgpa}, ≤ {v.maxBacklogs} backlogs, {v.branches.join("/")}</td><td>{v.date}</td>
                <td><button className="btn link" onClick={() => delDrive(v.id)}>Remove</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div className="card tw">
        <h2>Companies</h2>
        {db.companies.length === 0 ? <Empty>No companies yet.</Empty> : (
          <table>
            <thead><tr><th>Company</th><th>Sector</th><th>Recruiter</th><th>Email</th><th /></tr></thead>
            <tbody>{db.companies.map((x) => (
              <tr key={x.id}><td>{x.name}</td><td>{x.sector}</td><td>{x.recruiter}</td><td>{x.recruiterEmail}</td>
                <td><button className="btn link" onClick={() => delCompany(x.id)}>Remove</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Picker({ db, sid, did, setSid, setDid }) {
  return (
    <div className="grid">
      <F label="Student"><select value={sid} onChange={(e) => setSid(e.target.value)}><option value="">Select…</option>{db.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>
      <F label="Drive"><select value={did} onChange={(e) => setDid(e.target.value)}><option value="">Select…</option>{db.drives.map((v) => <option key={v.id} value={v.id}>{db.companies.find((c) => c.id === v.companyId)?.name} · {v.role}</option>)}</select></F>
    </div>
  );
}

function Eligibility({ db, say }) {
  const [sid, setSid] = useState("");
  const [did, setDid] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    const s = db.students.find((x) => x.id === sid), v = db.drives.find((x) => x.id === did);
    if (!s || !v) return say("Choose a student and a drive.", "bad");
    setBusy(true);
    try { setRes({ ...(await runCheck(s, v)), s, v }); } catch (e) { say(e.message, "bad"); }
    setBusy(false);
  };
  return (
    <>
      <div className="card">
        <Picker db={db} sid={sid} did={did} setSid={(v) => { setSid(v); setRes(null); }} setDid={(v) => { setDid(v); setRes(null); }} />
        <p><button className="btn" onClick={go} disabled={busy}>{busy ? "Checking…" : "Check eligibility"}</button></p>
      </div>
      {res && (res.eligible ? (
        <div className="verdict ok"><h3>{res.s.name} is eligible</h3>Meets the CGPA, backlog and branch criteria for {res.v.role}. You can apply them in the next module.</div>
      ) : (
        <div className="verdict bad"><h3>{res.s.name} is not eligible</h3><ul>{res.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
      ))}
    </>
  );
}

function Applications({ db, update, say }) {
  const [sid, setSid] = useState("");
  const [did, setDid] = useState("");
  const [busy, setBusy] = useState(false);
  const sname = (id) => db.students.find((s) => s.id === id)?.name;
  const dlabel = (id) => { const v = db.drives.find((x) => x.id === id); return v ? `${db.companies.find((c) => c.id === v.companyId)?.name} · ${v.role}` : ""; };
  const apply = async () => {
    const s = db.students.find((x) => x.id === sid), v = db.drives.find((x) => x.id === did);
    if (!s || !v) return say("Choose a student and a drive.", "bad");
    if (db.applications.some((a) => a.studentId === sid && a.driveId === did)) return say("This student already applied to this drive.", "bad");
    setBusy(true);
    try {
      const r = await runCheck(s, v);
      if (!r.eligible) say(`Not eligible: ${r.reasons[0]}`, "bad");
      else { update((d) => { d.applications.push({ id: uid(), studentId: sid, driveId: did, status: "Applied" }); return d; }); say("Application submitted."); }
    } catch (e) { say(e.message, "bad"); }
    setBusy(false);
  };
  const setStatus = (id, status) => update((d) => { d.applications.find((a) => a.id === id).status = status; return d; });
  return (
    <>
      <div className="card">
        <Picker db={db} sid={sid} did={did} setSid={setSid} setDid={setDid} />
        <p><button className="btn" onClick={apply} disabled={busy}>{busy ? "Checking…" : "Apply student"}</button></p>
      </div>
      <div className="card tw">
        {db.applications.length === 0 ? <Empty>No applications yet. Apply an eligible student above.</Empty> : (
          <table>
            <thead><tr><th>Student</th><th>Drive</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>{db.applications.map((a) => (
              <tr key={a.id}><td>{sname(a.studentId)}</td><td>{dlabel(a.driveId)}</td>
                <td><span className={`pill ${a.status}`}>{a.status}</span></td>
                <td><select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} aria-label="Change status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Report({ db }) {
  const sel = db.applications.filter((a) => a.status === "Selected");
  const placed = new Set(sel.map((a) => a.studentId));
  const rate = db.students.length ? Math.round((placed.size / db.students.length) * 100) : 0;
  const best = sel.reduce((m, a) => Math.max(m, db.drives.find((d) => d.id === a.driveId)?.ctc || 0), 0);
  const avg = sel.length ? (sel.reduce((t, a) => t + (db.drives.find((d) => d.id === a.driveId)?.ctc || 0), 0) / sel.length).toFixed(1) : "0";
  return (
    <>
      <div className="stats">
        <div className="stat hero"><b>{rate}%</b><span>Students placed</span></div>
        <div className="stat"><b>{db.students.length}</b><span>Students</span></div>
        <div className="stat"><b>{db.drives.length}</b><span>Drives</span></div>
        <div className="stat"><b>{best} LPA</b><span>Highest package</span></div>
        <div className="stat"><b>{avg} LPA</b><span>Average package</span></div>
      </div>
      <div className="card tw">
        <h2>By company</h2>
        <table>
          <thead><tr><th>Company</th><th>Drives</th><th>Applicants</th><th>Selected</th><th>Selection rate</th></tr></thead>
          <tbody>{db.companies.map((c) => {
            const ids = db.drives.filter((d) => d.companyId === c.id).map((d) => d.id);
            const apps = db.applications.filter((a) => ids.includes(a.driveId));
            const n = apps.filter((a) => a.status === "Selected").length;
            const pct = apps.length ? Math.round((n / apps.length) * 100) : 0;
            return <tr key={c.id}><td>{c.name}</td><td>{ids.length}</td><td>{apps.length}</td><td>{n}</td><td><div className="bar"><i style={{ width: pct + "%" }} /></div></td></tr>;
          })}</tbody>
        </table>
      </div>
      <div className="card tw">
        <h2>By student</h2>
        <table>
          <thead><tr><th>Student</th><th>Branch</th><th>CGPA</th><th>Applications</th><th>Result</th></tr></thead>
          <tbody>{db.students.map((s) => (
            <tr key={s.id}><td>{s.name}</td><td>{s.branch}</td><td>{s.cgpa}</td>
              <td>{db.applications.filter((a) => a.studentId === s.id).length}</td>
              <td><span className={`pill ${placed.has(s.id) ? "ok" : ""}`}>{placed.has(s.id) ? "Placed" : "Not placed yet"}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
      <button className="btn noprint" onClick={() => window.print()}>Print or save as PDF</button>
    </>
  );
}
