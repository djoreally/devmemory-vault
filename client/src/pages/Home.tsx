import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Aperture,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDot,
  Clapperboard,
  Clipboard,
  Copy,
  Crosshair,
  Eye,
  Film,
  Gauge,
  Layers3,
  LockKeyhole,
  MapPin,
  Mic2,
  Play,
  ScanLine,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const defaultBrief = `Create a cinematic street basketball commercial for MOMS Mobile Oil Change. Show the white service van in a clean urban neighborhood with a basketball court attached to the back. A packed outdoor-game crowd surrounds two players in a high-level one-on-one. Start with an overhead drone shot, descend to the players, then follow the action as one player crosses over and scores.`;

const defaultPrompt = `Create a polished live-action sports commercial in a vibrant, clean urban neighborhood, not rundown: a freshly resurfaced outdoor basketball court is physically attached to the rear of a distinctive white mobile service van. The van is a hero subject and must remain clearly visible in the opening and closing composition. On both visible sides of the van, show the exact readable English brand text: “MOMS Mobile Oil Change.” On the service panel, show the exact readable phrase: “GET YOUR OIL CHANGED.” Keep this spelling exact, with no invented or garbled lettering; preserve the van’s shape, wheels, decals, and logo geometry throughout.

A packed block-party crowd surrounds the court like an outdoor NBA game: vendors with colorful canopies, families, children, fans filming on phones, and joyful reactions, with individually distinct faces and natural secondary motion. Two adult male streetball players, Player A in a red jersey with number 23 and Player B in a blue jersey with number 11, play a short one-on-one sequence with elite professional-level skill, explosive but believable footwork, controlled crossover, realistic acceleration, and a clean athletic finish. Do not imitate or depict any real athlete’s face or likeness.

SHOT PLAN / BLOCKING
0.0–2.3s — OVERHEAD ESTABLISHING: High overhead drone looking straight down at the full court, van, attached hoop, players, vendors, and dense crowd. Slowly push forward and descend while keeping the van and both players in frame.
2.3–2.6s — MOTIVATED MATCH CUT: Cut at the exact moment Player A begins the crossover. Match player positions, ball position, court lines, sun direction, van orientation, and crowd geography exactly.
2.6–6.8s — COURT-LEVEL TRACKING: Low stabilized gimbal shot orbiting smoothly around the players while keeping the van branding visible in the background. One clean crossover, discrete physically accurate bounces, realistic defensive slide, controlled step-through, soft bank shot.
6.8–8.0s — HERO FINISH: Crane back and slightly up to reveal the made basket, cheering crowd, and full branded van.

CONTINUITY LOCKS
Same players, uniforms, numbers, court, van, lighting, and crowd layout across every shot. Natural late-afternoon sunlight, contact shadows beneath shoes and van tires, realistic weight and gravity, crisp fabric and skin detail, documentary sports-commercial energy.

NEGATIVE CONTROLS
Avoid rubbery knees, extra joints, fused or clipping limbs, floating feet, duplicated basketballs, sticky palms, impossible bounce height, teleporting players, warped wheels, melting faces, crowd shimmer, disconnected shadows, van deformation, logo warping, misspelled text, gibberish text, random cuts, or changes in jersey numbers.`;

const shotData = [
  { time: "00:00–02:30", label: "Overhead establish", icon: Aperture, text: "Drone descends over the whole block; van, court, crowd and players all readable." },
  { time: "02:30–02:60", label: "Motivated match cut", icon: ScanLine, text: "Cut on the crossover. Lock player, ball, court-line and crowd coordinates." },
  { time: "02:60–06:80", label: "Court-level track", icon: Crosshair, text: "Orbit the one-on-one action. Keep the brand in the background plane." },
  { time: "06:80–08:00", label: "Product hero", icon: Target, text: "Crane back to the made basket, cheering crowd and full van silhouette." },
];

const riskData = [
  { label: "Brand legibility", value: "Locked", detail: "Exact copy + visibility windows", tone: "lime" },
  { label: "Spatial continuity", value: "Mapped", detail: "Match-cut coordinates", tone: "blue" },
  { label: "Human physics", value: "Guarded", detail: "Skeletal + contact controls", tone: "amber" },
  { label: "Crowd realism", value: "Guarded", detail: "Distinct agents + reactions", tone: "violet" },
];

function buildPrompt(brief: string, brand: string, serviceCopy: string, jerseyA: string, jerseyB: string) {
  const safeBrief = brief.trim() || defaultBrief;
  return `DIRECTOR'S BRIEF\n${safeBrief}\n\nHERO PRODUCT LOCK\nA distinctive white mobile service van is a primary subject, not background dressing. Keep the van fully recognizable in the first establishing shot and final hero shot. Preserve body geometry, tires sitting naturally on asphalt, decals, and logo perspective. Render exact readable English text: “${brand}” and service-panel copy: “${serviceCopy}”. No gibberish, misspellings, or logo warping.\n\nCAST + ACTION LOCK\nTwo adult male streetball players: Player A in a red jersey #${jerseyA}; Player B in a blue jersey #${jerseyB}. Elite professional-level skill and believable weight, without imitating any real athlete's face or likeness. One clean crossover, one realistic lateral defensive slide, one controlled step-through, one soft bank shot. Discrete hand releases and floor contacts for every dribble; no sticky palms or duplicated balls.\n\nWORLD + CROWD\nA clean, vibrant urban neighborhood with a freshly resurfaced court physically attached to the van. A packed outdoor-game crowd surrounds it: vendors, families, children, fans filming, and joyful reactions. Distinct individuals, natural secondary motion, stable faces, grounded feet, and contact shadows.\n\nSHOT CHOREOGRAPHY\n0.0–2.3s — high overhead drone; slowly push and descend while keeping the van, attached court, hoop, players, vendors, and crowd in frame.\n2.3–2.6s — motivated match cut on the crossover; match player coordinates, ball position, court lines, van orientation, sun direction, and crowd geography.\n2.6–6.8s — low stabilized gimbal orbit; follow the players while keeping the van branding readable in the background.\n6.8–8.0s — crane back and slightly up; end on the made basket, cheering crowd, and complete branded van.\n\nQUALITY GATES\nHigh temporal consistency. Rigid skeletal structure. No limb merging, clipping, rubbery joints, floating feet, teleportation, or jersey-number changes. Physically accurate basketball bounce height and gravity. Correct van-wheel contact and connected shadows. No melting faces, crowd shimmer, disconnected shadows, van deformation, brand text drift, random cuts, or changes in lighting. Maintain the same players, uniforms, van, court, and geography in every shot.`;
}

function ToneBar({ tone }: { tone: string }) {
  return <span className={`tone-bar ${tone}`} />;
}

export default function Home() {
  const [brief, setBrief] = useState(defaultBrief);
  const [brand, setBrand] = useState("MOMS Mobile Oil Change");
  const [serviceCopy, setServiceCopy] = useState("GET YOUR OIL CHANGED");
  const [jerseyA, setJerseyA] = useState("23");
  const [jerseyB, setJerseyB] = useState("11");
  const [duration, setDuration] = useState("8 seconds");
  const [generated, setGenerated] = useState(defaultPrompt);
  const [activeTab, setActiveTab] = useState<"prompt" | "audit">("prompt");
  const [copied, setCopied] = useState(false);

  const wordCount = brief.trim() ? brief.trim().split(/\s+/).length : 0;
  const shotCount = 4;
  const controls = useMemo(() => [brand, serviceCopy, jerseyA, jerseyB], [brand, serviceCopy, jerseyA, jerseyB]);

  const runConverter = () => {
    setGenerated(buildPrompt(brief, brand, serviceCopy, jerseyA, jerseyB));
    toast.success("Director pass complete", { description: "Your brief is now locked to a shot plan and quality gates." });
  };

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(generated);
    setCopied(true);
    toast.success("Prompt copied", { description: "Ready to paste into your video generator." });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Clapperboard size={18} strokeWidth={2.3} /></div>
          <div>
            <div className="eyebrow">Studio tool / 01</div>
            <div className="brand-name">Director Prompt Studio</div>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="live-dot"><span /> LOCAL WORKSPACE</span>
          <span className="divider" />
          <span className="version">ORCHESTRATOR <b>v1.0</b></span>
        </div>
      </header>

      <main className="page-wrap">
        <section className="hero-row">
          <div className="hero-copy">
            <div className="kicker"><Sparkles size={14} /> PROMPT → PRODUCTION BLUEPRINT</div>
            <h1>Direct every <em>movement.</em></h1>
            <p className="hero-lede">Turn a rough video idea into a continuity-safe, director-level prompt—with product visibility, shot choreography, and failure controls built in.</p>
          </div>
          <div className="hero-stats">
            <div className="stat"><span>Brief words</span><strong>{wordCount}</strong><small>captured</small></div>
            <div className="stat"><span>Shot beats</span><strong>{shotCount}</strong><small>time-locked</small></div>
            <div className="stat accent"><span>Risk controls</span><strong>12</strong><small>active</small></div>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="panel brief-panel">
            <div className="panel-head">
              <div>
                <div className="section-number">01 <span>INPUT</span></div>
                <h2>Scene brief</h2>
              </div>
              <div className="head-status"><CircleDot size={12} /> Draft</div>
            </div>
            <label className="field-label" htmlFor="brief">Your raw direction</label>
            <textarea id="brief" value={brief} onChange={(event) => setBrief(event.target.value)} spellCheck={false} />
            <div className="textarea-foot"><span>{wordCount} words</span><span>Describe the feeling. We’ll engineer the physics.</span></div>

            <div className="subsection-head"><span className="small-rule" /> Product locks <LockKeyhole size={14} /></div>
            <div className="field-grid">
              <div className="field-group span-2"><label className="field-label" htmlFor="brand">Exact company / brand</label><div className="input-wrap"><span className="input-prefix">A</span><input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} /></div></div>
              <div className="field-group span-2"><label className="field-label" htmlFor="service-copy">Exact service copy</label><div className="input-wrap"><span className="input-prefix">T</span><input id="service-copy" value={serviceCopy} onChange={(event) => setServiceCopy(event.target.value)} /></div></div>
              <div className="field-group"><label className="field-label" htmlFor="jersey-a">Red jersey</label><div className="input-wrap"><span className="input-prefix red">#</span><input id="jersey-a" value={jerseyA} onChange={(event) => setJerseyA(event.target.value)} /></div></div>
              <div className="field-group"><label className="field-label" htmlFor="jersey-b">Blue jersey</label><div className="input-wrap"><span className="input-prefix blue">#</span><input id="jersey-b" value={jerseyB} onChange={(event) => setJerseyB(event.target.value)} /></div></div>
            </div>

            <div className="field-grid lower-fields">
              <div className="field-group"><label className="field-label">Visual mode</label><button className="select-button" type="button">Live action sports <ChevronDown size={15} /></button></div>
              <div className="field-group"><label className="field-label">Clip length</label><button className="select-button" type="button">{duration} <ChevronDown size={15} /></button></div>
            </div>
            <button className="primary-button" type="button" onClick={runConverter}><Wand2 size={17} /> Orchestrate this brief <ArrowUpRight size={17} /></button>
            <div className="micro-note"><Zap size={13} /> Deterministic controls are applied in your browser. Nothing is uploaded.</div>
          </section>

          <section className="panel output-panel">
            <div className="panel-head output-head">
              <div>
                <div className="section-number">02 <span>DIRECTOR PASS</span></div>
                <h2>Production blueprint</h2>
              </div>
              <button className={`copy-button ${copied ? "copied" : ""}`} type="button" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy prompt"}</button>
            </div>
            <div className="blueprint-summary">
              <div className="summary-icon"><Film size={18} /></div>
              <div><strong>Urban court / branded vehicle</strong><span>Sports commercial · {duration} · {controls.length} locked variables</span></div>
              <div className="ready-badge"><span /> READY</div>
            </div>

            <div className="tabs" role="tablist">
              <button className={activeTab === "prompt" ? "active" : ""} onClick={() => setActiveTab("prompt")} type="button"><Clipboard size={14} /> Locked prompt</button>
              <button className={activeTab === "audit" ? "active" : ""} onClick={() => setActiveTab("audit")} type="button"><Gauge size={14} /> Risk audit</button>
            </div>

            {activeTab === "prompt" ? <div className="prompt-window"><div className="window-bar"><span className="window-dots"><i /><i /><i /></span><span>director_blueprint.txt</span><span className="window-lock"><LockKeyhole size={12} /> locked</span></div><pre>{generated}</pre></div> : <div className="audit-list">{riskData.map((risk) => <div className="audit-row" key={risk.label}><ToneBar tone={risk.tone} /><div className="audit-copy"><strong>{risk.label}</strong><span>{risk.detail}</span></div><span className={`audit-value ${risk.tone}`}>{risk.value}</span><Check size={16} className="audit-check" /></div>)}<div className="audit-callout"><AlertTriangle size={16} /><span><strong>Known generator risk:</strong> exact text can still drift in current video models. Give the van a dedicated readable hold whenever copy is mission-critical.</span></div></div>}

            <div className="output-footer"><span><LockKeyhole size={13} /> {activeTab === "prompt" ? "Continuity locks included" : "Failure modes mapped"}</span><span>Updated just now</span></div>
          </section>
        </div>

        <section className="lower-grid">
          <div className="panel shot-panel">
            <div className="panel-head compact"><div><div className="section-number">03 <span>CAMERA CHOREOGRAPHY</span></div><h2>Shot board</h2></div><span className="board-tag"><MapPin size={13} /> geography locked</span></div>
            <div className="shot-list">{shotData.map((shot, index) => { const Icon = shot.icon; return <div className="shot-row" key={shot.time}><div className="shot-index">0{index + 1}</div><div className="shot-icon"><Icon size={16} /></div><div className="shot-time">{shot.time}</div><div className="shot-detail"><strong>{shot.label}</strong><span>{shot.text}</span></div><div className="shot-connector" /></div>; })}</div>
          </div>
          <div className="panel guard-panel">
            <div className="panel-head compact"><div><div className="section-number">04 <span>GUARDRAILS</span></div><h2>Failure prevention</h2></div><Eye size={17} className="muted-icon" /></div>
            <div className="guard-visual"><div className="guard-ring outer" /><div className="guard-ring middle" /><div className="guard-ring inner" /><Crosshair size={24} /><span className="guard-label top">ANATOMY</span><span className="guard-label right">TEXT</span><span className="guard-label bottom">PHYSICS</span><span className="guard-label left">LIGHT</span></div>
            <div className="guard-footer"><span><span className="signal green" /> Skeletal consistency</span><span><span className="signal amber" /> Product geometry</span><span><span className="signal violet" /> Crowd agents</span></div>
          </div>
        </section>

        <footer className="page-footer"><span>Built for prompts that survive the cut.</span><span>Reference diagnosis: van text drift · jump cut geography · limb morphing · ball physics</span><span className="footer-mark"><Mic2 size={13} /> director's desk</span></footer>
      </main>
    </div>
  );
}
