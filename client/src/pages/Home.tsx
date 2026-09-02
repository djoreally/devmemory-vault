import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Clipboard,
  Clock3,
  Copy,
  Database,
  FileKey2,
  FolderGit2,
  KeyRound,
  Lock,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  MemoryRecord,
  clearMemories,
  deriveVaultKey,
  exportEncryptedVault,
  getOrCreateSalt,
  importEncryptedVault,
  loadMemories,
  makeRecord,
  removeMemory,
  saveMemory,
  searchMemories,
} from "@/lib/vault";

const sampleRecords: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">[] = [
  {
    project: "customer-portal",
    title: "Why we chose OAuth for browser login",
    prompt: "We need browser-based authentication for the customer portal. What approach should we use and why?",
    response: "Use OAuth with a server-side callback. It keeps the browser flow simple, avoids shipping secrets to the client, and gives the app a stable place to validate sessions. Keep the provider exchange in server/auth.ts and expose only the session state to the React app.",
    source: "Claude Code",
    model: "Sonnet 4",
    tags: ["architecture", "auth", "decision"],
  },
  {
    project: "mobile-dashboard",
    title: "Fix for the stale analytics query",
    prompt: "The dashboard still shows yesterday's numbers after changing the date range. What is going stale?",
    response: "The query input is being recreated during render, so the cache key is unstable. Memoize the date-range object and invalidate the analytics query after a successful mutation. This keeps the UI responsive without forcing a full reload.",
    source: "Codex",
    model: "GPT-5",
    tags: ["debugging", "frontend", "cache"],
  },
];

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const formatRelative = (value: string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
};

function LockScreen({ onUnlock }: { onUnlock: (key: CryptoKey, passphrase: string) => Promise<void> }) {
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasVault, setHasVault] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasVault(Boolean(localStorage.getItem("devmemory-vault-salt")));
  }, []);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (passphrase.length < 8) return setError("Use at least 8 characters for your local vault passphrase.");
    if (!hasVault && passphrase !== confirm) return setError("The passphrases do not match.");
    setBusy(true);
    try {
      const key = await deriveVaultKey(passphrase, getOrCreateSalt());
      await onUnlock(key, passphrase);
    } catch {
      setError("This vault could not be unlocked. Check the passphrase or import a valid vault file.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="lock-screen">
    <div className="lock-grid" />
    <div className="lock-card">
      <div className="lock-brand"><div className="vault-mark"><Database size={22} /></div><span>DEVMEMORY <b>VAULT</b></span></div>
      <div className="lock-orbit"><div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" /><div className="orbit-core"><Lock size={28} /></div><span className="orbit-label orbit-label-top">LOCAL</span><span className="orbit-label orbit-label-right">AES-256</span><span className="orbit-label orbit-label-bottom">PRIVATE</span><span className="orbit-label orbit-label-left">OFFLINE</span></div>
      <div className="lock-kicker"><ShieldCheck size={14} /> YOUR DEVELOPMENT MEMORY, SEALED</div>
      <h1>Nothing leaves<br /><em>this machine.</em></h1>
      <p className="lock-copy">A local, encrypted vault for the conversations that shape your codebase. Unlock it to recall the right decision—not the whole transcript.</p>
      <form onSubmit={unlock} className="unlock-form">
        <label htmlFor="passphrase">{hasVault ? "Unlock your vault" : "Create a vault passphrase"}</label>
        <div className="lock-input"><KeyRound size={16} /><input id="passphrase" type="password" autoFocus value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="At least 8 characters" /></div>
        {!hasVault && <><label htmlFor="confirm">Confirm passphrase</label><div className="lock-input"><KeyRound size={16} /><input id="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat it once" /></div></>}
        {error && <div className="form-error"><CircleHelp size={14} /> {error}</div>}
        <button className="unlock-button" disabled={busy} type="submit"><Unlock size={16} /> {busy ? "Opening local vault…" : hasVault ? "Unlock vault" : "Create local vault"} <span>↗</span></button>
      </form>
      <div className="lock-note"><span /><span>Encryption happens in your browser. Your passphrase is never stored.</span></div>
    </div>
    <div className="lock-footer"><span>DEVMEMORY / LOCAL-FIRST TOOLING</span><span>BUILD HISTORY YOU CAN TRUST</span></div>
  </div>;
}

function Sidebar({ activeProject, projects, onProject, onImport, onExport, onLock, onClear }: { activeProject: string; projects: string[]; onProject: (project: string) => void; onImport: (event: ChangeEvent<HTMLInputElement>) => void; onExport: () => void; onLock: () => void; onClear: () => void }) {
  return <aside className="sidebar">
    <div className="sidebar-brand"><div className="mini-mark"><Database size={17} /></div><div><b>DEVMEMORY</b><span>vault / local</span></div></div>
    <div className="sidebar-status"><span /> vault unlocked <b>AES-256</b></div>
    <div className="nav-label">Workspace</div>
    <button className={`nav-item ${activeProject === "all" ? "active" : ""}`} onClick={() => onProject("all")}><Archive size={15} /><span>All memories</span><b>{activeProject === "all" ? "" : ""}</b></button>
    <div className="nav-label projects-label">Projects <span>{projects.length}</span></div>
    <div className="project-list">{projects.map((project) => <button key={project} className={`project-item ${activeProject === project ? "active" : ""}`} onClick={() => onProject(project)}><FolderGit2 size={14} /><span>{project}</span></button>)}</div>
    <div className="sidebar-bottom">
      <div className="nav-label">Vault</div>
      <label className="nav-item nav-file"><ArrowUpFromLine size={15} /><span>Import vault</span><input type="file" accept="application/json" onChange={onImport} /></label>
      <button className="nav-item" onClick={onExport}><ArrowDownToLine size={15} /><span>Export encrypted</span></button>
      <button className="nav-item" onClick={onClear}><Trash2 size={15} /><span>Clear vault</span></button>
      <div className="sidebar-rule" />
      <button className="nav-item" onClick={onLock}><LogOut size={15} /><span>Lock workspace</span></button>
    </div>
  </aside>;
}

function MemoryRow({ record, selected, onSelect }: { record: MemoryRecord; selected: boolean; onSelect: () => void }) {
  return <button className={`memory-row ${selected ? "selected" : ""}`} onClick={onSelect}>
    <div className="memory-source"><span className={`source-icon ${record.source.toLowerCase().includes("codex") ? "source-blue" : "source-purple"}`}><Bot size={15} /></span><span>{record.source}</span></div>
    <div className="memory-main"><strong>{record.title}</strong><span>{record.prompt}</span><div className="tag-row">{record.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</div></div>
    <div className="memory-meta"><span>{formatRelative(record.createdAt)}</span><span className="memory-project"><FolderGit2 size={12} /> {record.project}</span></div>
    <ChevronDown className="row-chevron" size={16} />
  </button>;
}

function DetailPanel({ record, onClose, onDelete }: { record: MemoryRecord; onClose: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState("");
  const copy = async (value: string, label: string) => { await navigator.clipboard?.writeText(value); setCopied(label); toast.success(`${label} copied`); window.setTimeout(() => setCopied(""), 1400); };
  return <div className="detail-overlay" onClick={onClose}><aside className="detail-panel" onClick={(event) => event.stopPropagation()}>
    <div className="detail-top"><div className="detail-kicker"><MessageSquareText size={14} /> MEMORY RECORD</div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
    <div className="detail-title"><h2>{record.title}</h2><div className="detail-badges"><span><FolderGit2 size={12} /> {record.project}</span><span><Clock3 size={12} /> {formatDate(record.createdAt)}</span></div></div>
    <div className="detail-rule" />
    <div className="exchange-block"><div className="exchange-label"><span className="label-dot prompt-dot" /> Developer prompt <button onClick={() => copy(record.prompt, "Prompt")}>{copied === "Prompt" ? <Check size={13} /> : <Copy size={13} />}</button></div><p>{record.prompt}</p></div>
    <div className="exchange-block response-block"><div className="exchange-label"><span className="label-dot response-dot" /> AI response <button onClick={() => copy(record.response, "Response")}>{copied === "Response" ? <Check size={13} /> : <Copy size={13} />}</button></div><p>{record.response}</p></div>
    <div className="detail-context"><div><span>Source</span><strong>{record.source}</strong></div><div><span>Model</span><strong>{record.model}</strong></div><div><span>Captured</span><strong>{formatDate(record.createdAt)}</strong></div></div>
    <div className="detail-tags">{record.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    <div className="detail-actions"><button className="danger-button" onClick={onDelete}><Trash2 size={14} /> Delete record</button><button className="copy-record" onClick={() => copy(`${record.title}\n\nPrompt: ${record.prompt}\n\nAI response: ${record.response}`, "Record")}><Clipboard size={14} /> {copied === "Record" ? "Copied record" : "Copy record"}</button></div>
  </aside></div>;
}

export default function Home() {
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [activeProject, setActiveProject] = useState("all");
  const [selected, setSelected] = useState<MemoryRecord | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const unlock = async (nextKey: CryptoKey) => {
    let loaded = await loadMemories(nextKey);
    if (!loaded.length) {
      const demos = sampleRecords.map((record) => makeRecord(record));
      await Promise.all(demos.map((record) => saveMemory(record, nextKey)));
      loaded = demos;
      setToastMessage("Welcome records added locally. Delete them anytime.");
    }
    setKey(nextKey);
    setRecords(loaded);
  };

  useEffect(() => { if (toastMessage) { const timer = window.setTimeout(() => setToastMessage(""), 4500); return () => window.clearTimeout(timer); } }, [toastMessage]);

  const projects = useMemo(() => Array.from(new Set(records.map((record) => record.project))).sort(), [records]);
  const filtered = useMemo(() => searchMemories(records, query, activeProject), [records, query, activeProject]);
  const visibleProjects = activeProject === "all" ? "All projects" : activeProject;

  const lock = () => { setKey(null); setRecords([]); setSelected(null); setQuery(""); setActiveProject("all"); };
  const deleteSelected = async () => { if (!selected) return; await removeMemory(selected.id); setRecords((current) => current.filter((record) => record.id !== selected.id)); setSelected(null); toast.success("Memory deleted from the local vault"); };
  const clearVault = async () => { if (!window.confirm("Clear every encrypted memory in this browser? This cannot be undone unless you exported a vault.")) return; await clearMemories(); setRecords([]); setSelected(null); toast.success("Local vault cleared"); };
  const exportVault = async () => { const payload = await exportEncryptedVault(); const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `devmemory-vault-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); toast.success("Encrypted vault exported"); };
  const importVault = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const payload = JSON.parse(await file.text()); await importEncryptedVault(payload); lock(); toast.success("Vault imported", { description: "Unlock it with the passphrase used when it was exported." }); } catch { toast.error("Could not import that vault file"); } event.target.value = ""; };

  if (!key) return <LockScreen onUnlock={unlock} />;

  return <div className="vault-app">
    <Sidebar activeProject={activeProject} projects={projects} onProject={(project) => { setActiveProject(project); setShowMobileNav(false); }} onImport={importVault} onExport={exportVault} onLock={lock} onClear={clearVault} />
    {showMobileNav && <div className="mobile-nav-backdrop" onClick={() => setShowMobileNav(false)} />}
    <main className="main-content">
      <header className="vault-header"><button className="mobile-menu" onClick={() => setShowMobileNav(true)}><Menu size={20} /></button><div><div className="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{visibleProjects}</strong></div><h1>Memory library</h1></div><div className="header-actions"><div className="secure-chip"><ShieldCheck size={14} /><span>Local only</span><i /></div><button className="settings-button"><Settings2 size={17} /></button><button className="avatar-button">JD</button></div></header>
      <section className="stats-row"><div className="stat-card"><div className="stat-icon green"><Archive size={17} /></div><div><span>Stored memories</span><strong>{records.length}</strong></div><small><span className="trend-dot" /> encrypted records</small></div><div className="stat-card"><div className="stat-icon purple"><FolderGit2 size={17} /></div><div><span>Active projects</span><strong>{projects.length}</strong></div><small>across your vault</small></div><div className="stat-card"><div className="stat-icon blue"><Zap size={17} /></div><div><span>Recall mode</span><strong>Hybrid</strong></div><small>semantic + exact match</small></div><div className="stat-card trust-card"><div className="trust-lock"><Lock size={16} /></div><div><span>Vault status</span><strong>Protected</strong></div><small>AES-GCM · browser local</small></div></section>
      <section className="library-toolbar"><div className="toolbar-title"><span className="section-kicker">PROJECT MEMORY</span><h2>{activeProject === "all" ? "Everything worth remembering" : activeProject}</h2><p>Search the decisions, fixes, and AI responses that shaped your work.</p></div><button className="capture-button" onClick={() => setComposerOpen(true)}><Plus size={17} /> Capture exchange <span>⌘ K</span></button></section>
      <section className="search-row"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask your project memory…  e.g. why did we choose OAuth?" /><kbd>⌘ K</kbd></div><button className="filter-button"><span>Any time</span><ChevronDown size={15} /></button><button className="filter-button"><span>All sources</span><ChevronDown size={15} /></button><button className="view-button"><MoreHorizontal size={17} /></button></section>
      <section className="memory-section"><div className="section-line"><span>{filtered.length} {filtered.length === 1 ? "memory" : "memories"}</span><button>Sort: <b>Most relevant</b> <ChevronDown size={13} /></button></div>{filtered.length ? <div className="memory-list">{filtered.map((record) => <MemoryRow key={record.id} record={record} selected={selected?.id === record.id} onSelect={() => setSelected(record)} />)}</div> : <div className="empty-state"><div><Search size={22} /></div><h3>No memories found</h3><p>Try another phrase or capture the exchange that matters.</p></div>}</section>
      <footer className="vault-footer"><span><FileKey2 size={13} /> Your data is stored in this browser only</span><span>Last indexed just now</span><span className="footer-version">DEVMEMORY V0.1 · LOCAL-FIRST</span></footer>
    </main>
    {selected && <DetailPanel record={selected} onClose={() => setSelected(null)} onDelete={deleteSelected} />}
    {composerOpen && <CaptureModal vaultKey={key} onSaved={(record) => { setRecords((current) => [record, ...current]); setComposerOpen(false); toast.success("Exchange encrypted and saved"); }} onClose={() => setComposerOpen(false)} />}
    {toastMessage && <div className="welcome-toast"><Sparkles size={15} /> {toastMessage}<button onClick={() => setToastMessage("")}><X size={14} /></button></div>}
  </div>;
}

function CaptureModal({ vaultKey, onSaved, onClose }: { vaultKey: CryptoKey; onSaved: (record: MemoryRecord) => void; onClose: () => void }) {
  const [project, setProject] = useState("customer-portal");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [source, setSource] = useState("Claude Code");
  const [model, setModel] = useState("Sonnet 4");
  const [tags, setTags] = useState("decision, development");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!title.trim() || !prompt.trim() || !response.trim()) return toast.error("Add a title, prompt, and AI response"); setSaving(true); const record = makeRecord({ project: project.trim() || "untitled-project", title: title.trim(), prompt: prompt.trim(), response: response.trim(), source, model, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) }); await saveMemory(record, vaultKey); onSaved(record); };
  return <div className="modal-backdrop" onClick={onClose}><div className="capture-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="section-kicker">NEW RECORD</div><h2>Capture an exchange</h2><p>Save the useful part. Leave the whole transcript behind.</p></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div><form onSubmit={submit}><div className="modal-grid"><div><label>Memory title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Why we chose OAuth" /></label></div><div><label>Project<input value={project} onChange={(event) => setProject(event.target.value)} placeholder="repository-name" /></label></div><div className="full"><label>Developer prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What did you ask the agent?" /></label></div><div className="full"><label>AI response<textarea value={response} onChange={(event) => setResponse(event.target.value)} placeholder="What should your future self be able to retrieve?" /></label></div><div><label>Source<select value={source} onChange={(event) => setSource(event.target.value)}><option>Claude Code</option><option>Codex</option><option>Cursor</option><option>Gemini CLI</option><option>Manual note</option></select></label></div><div><label>Model<input value={model} onChange={(event) => setModel(event.target.value)} /></label></div><div className="full"><label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} /></label></div></div><div className="modal-footer"><span><Lock size={13} /> AES-GCM encrypted before storage</span><button className="save-button" disabled={saving} type="submit"><Check size={15} /> {saving ? "Encrypting…" : "Encrypt & save"}</button></div></form></div></div>;
}
