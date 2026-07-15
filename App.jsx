import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase.js";

/* ============================================================
   GESTION BOUTIQUE v0.2 — Connexion + base de données Supabase
   Toutes les opérations sont sauvegardées automatiquement.
   ============================================================ */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
:root{
  --paper:#F6F4EE; --ink:#1E2521; --green:#14342B; --green2:#1D4A3D;
  --amber:#E0A82E; --amber2:#B9860F; --red:#C0392B; --line:#E3DFD3;
}
.app{font-family:'IBM Plex Sans',sans-serif;color:var(--ink);background:var(--paper);min-height:100vh;display:flex}
.display{font-family:'Space Grotesk',sans-serif}
.sidebar{background:var(--green);color:#EDEAE0;width:220px;flex-shrink:0;display:flex;flex-direction:column}
.navbtn{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:11px 18px;font-size:14px;
  border:none;background:none;color:#C9D4CD;cursor:pointer;border-left:3px solid transparent}
.navbtn:hover{background:var(--green2);color:#fff}
.navbtn.on{background:var(--green2);color:#fff;border-left-color:var(--amber);font-weight:600}
.card{background:#fff;border:1px solid var(--line);border-radius:10px}
.kpi{padding:16px 18px}
.kpi .lab{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7A8078}
.kpi .val{font-family:'Space Grotesk';font-size:24px;font-weight:700;margin-top:4px}
.btn{background:var(--green);color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:14px;
  font-weight:600;cursor:pointer}
.btn:hover{background:var(--green2)}
.btn:disabled{opacity:.5;cursor:wait}
.btn.gold{background:var(--amber);color:#2A1F04}.btn.gold:hover{background:var(--amber2);color:#fff}
.btn.ghost{background:transparent;color:var(--green);border:1px solid var(--green)}
.btn.sm{padding:5px 10px;font-size:12px}
.inp{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:14px;background:#fff;width:100%}
.inp:focus{outline:2px solid var(--amber);border-color:var(--amber)}
table.tb{width:100%;border-collapse:collapse;font-size:13.5px}
.tb th{text-align:left;padding:9px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;
  color:#7A8078;border-bottom:1px solid var(--line);background:#FBFAF6}
.tb td{padding:9px 12px;border-bottom:1px solid #F0EDE3}
.tb tr:last-child td{border-bottom:none}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:600}
.pill.ok{background:#E3EFE7;color:#14342B}.pill.warn{background:#FBEED0;color:#8A6207}
.pill.bad{background:#F8E2DE;color:#C0392B}
.ticket{background:#fff;width:300px;padding:18px 16px;font-family:'IBM Plex Sans',monospace;font-size:12.5px;
  box-shadow:0 8px 30px rgba(0,0,0,.25);
  -webkit-mask:radial-gradient(circle 6px at 8px 100%,transparent 6px,#000 6.5px) -8px 0/16px 100%;}
.dash{border-top:1.5px dashed #B8B3A4;margin:10px 0}
.tab{padding:8px 14px;border:none;background:none;font-size:13.5px;cursor:pointer;color:#7A8078;
  border-bottom:2px solid transparent;font-weight:600}
.tab.on{color:var(--green);border-bottom-color:var(--amber)}
.overlay{position:fixed;inset:0;background:rgba(20,30,25,.55);display:flex;align-items:center;
  justify-content:center;z-index:50}
@media print{ body *{visibility:hidden} .overlay,.overlay *{visibility:visible} .overlay{position:absolute;inset:0;background:#fff} .overlay button{display:none} }
.loginbox{max-width:380px;width:92%;margin:auto;background:#fff;border:1px solid var(--line);border-radius:14px;padding:28px}
@media(max-width:860px){.sidebar{width:64px}.navlabel{display:none}.brandtxt{display:none}}
`;

const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR") + " F";
const MODES = { especes: "Espèces", orange: "Orange Money", mtn: "MTN MoMo", wave: "Wave", credit: "Crédit" };

const joursAvant = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const dfr = (d) => new Date(d).toLocaleDateString("fr-FR");

const waLink = (tel, msg) => {
  let n = String(tel || "").replace(/\D/g, "");
  if (n && !n.startsWith("225")) n = "225" + n;
  return "https://wa.me/" + n + "?text=" + encodeURIComponent(msg);
};

const exportCSV = (nom, entetes, lignes) => {
  const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const contenu = "\uFEFF" + [entetes, ...lignes].map((l) => l.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = nom + ".csv"; a.click();
  URL.revokeObjectURL(url);
};
const today = () => new Date().toLocaleDateString("fr-FR");
const dstr = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

/* ============ ÉCRAN DE CONNEXION ============ */
function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setMsg("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) setMsg("Connexion impossible : " + error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) setMsg("Inscription impossible : " + error.message);
        else setMsg("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="app" style={{ alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="loginbox">
        <div className="display" style={{ fontSize: 24, fontWeight: 700, textAlign: "center" }}>
          Ma<span style={{ color: "var(--amber)" }}>Boutique</span>
        </div>
        <div style={{ textAlign: "center", color: "#7A8078", fontSize: 13, marginBottom: 20 }}>Gestion de commerce</div>
        <Field l="Adresse e-mail">
          <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
        </Field>
        <Field l="Mot de passe">
          <input className="inp" type="password" value={pass} onChange={(e) => setPass(e.target.value)}
            placeholder="6 caractères minimum" onKeyDown={(e) => e.key === "Enter" && go()} />
        </Field>
        <button className="btn gold" style={{ width: "100%", marginTop: 6, fontSize: 15 }} disabled={busy} onClick={go}>
          {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: msg.includes("impossible") ? "var(--red)" : "var(--green)" }}>{msg}</div>}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          {mode === "login" ? (
            <span>Pas encore de compte ? <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); setMsg(""); }} style={{ color: "var(--amber2)", fontWeight: 600 }}>Créer un compte</a></span>
          ) : (
            <span>Déjà un compte ? <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setMsg(""); }} style={{ color: "var(--amber2)", fontWeight: 600 }}>Se connecter</a></span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ APPLICATION ============ */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = vérification en cours
  const [page, setPage] = useState("dash");
  const [charge, setCharge] = useState(true);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [fours, setFours] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [achats, setAchats] = useState([]);
  const [journal, setJournal] = useState([]);
  const [clotures, setClotures] = useState([]);
  const [role, setRole] = useState(null);
  const [profils, setProfils] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [modeDoc, setModeDoc] = useState("ticket");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from("profils").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setRole(data?.role || "caissier"));
    chargerTout();
  }, [session]);

  useEffect(() => { if (role === "caissier") setPage("ventes"); }, [role]);

  const chargerTout = async () => {
    setCharge(true);
    const [p, c, f, m, v, a, j, cl, pr] = await Promise.all([
      supabase.from("produits").select("*").order("nom"),
      supabase.from("clients").select("*").order("nom"),
      supabase.from("fournisseurs").select("*").order("nom"),
      supabase.from("mouvements").select("*").order("id", { ascending: false }).limit(200),
      supabase.from("ventes").select("*").order("id", { ascending: false }).limit(200),
      supabase.from("achats").select("*").order("id", { ascending: false }).limit(200),
      supabase.from("journal").select("*").order("id").limit(500),
      supabase.from("clotures").select("*").order("id", { ascending: false }).limit(100),
      supabase.from("profils").select("*").order("email"),
    ]);
    setProduits(p.data || []);
    setClients(c.data || []);
    setFours((f.data || []).map((x) => ({ ...x })));
    setMouvements((m.data || []).map((x) => ({ ...x, date: dstr(x.date_m) })));
    setVentes((v.data || []).map((x) => ({ ...x, date: dstr(x.date_v), client: x.client_nom })));
    setAchats((a.data || []).map((x) => ({ ...x, date: dstr(x.date_a), four: x.fournisseur_nom })));
    setJournal((j.data || []).map((x) => ({ ...x, date: new Date(x.date_j).toLocaleDateString("fr-FR") })));
    setClotures((cl.data || []).map((x) => ({ ...x, date: dstr(x.date_c) })));
    setProfils(pr.data || []);
    setCharge(false);
  };

  /* ---------- Calculs ---------- */
  const caisse = useMemo(() => journal.reduce((s, j) => s + Number(j.debit) - Number(j.credit), 0), [journal]);
  const valeurStock = useMemo(() => produits.reduce((s, p) => s + Number(p.stock) * Number(p.cout), 0), [produits]);
  const creances = clients.reduce((s, c) => s + Number(c.credit), 0);
  const dettes = fours.reduce((s, f) => s + Number(f.dette), 0);
  const alertesStock = produits.filter((p) => Number(p.stock) <= Number(p.seuil));
  const alertesPeremption = produits.filter((p) => p.date_peremption && Number(p.stock) > 0 && joursAvant(p.date_peremption) <= 30);
  const caJour = ventes.filter((v) => v.date && v.date.startsWith(today())).reduce((s, v) => s + Number(v.total), 0);
  const benefTotal = ventes.reduce((s, v) => s + Number(v.marge), 0);
  const depensesTotal = useMemo(() => journal.filter((j) => j.type === "Dépense").reduce((s, j) => s + Number(j.credit), 0), [journal]);
  const benefNet = benefTotal - depensesTotal;
  const topProduits = useMemo(() => {
    const m = {};
    ventes.forEach((v) => (v.lignes || []).forEach((l) => (m[l.nom] = (m[l.nom] || 0) + l.qte)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [ventes]);

  /* ---------- Actions (chaque action écrit dans la base) ---------- */
  const oops = (e) => { alert("Erreur de sauvegarde : " + (e?.message || e)); };

  const journalAdd = async (lib, debit, credit, type) => {
    const { data, error } = await supabase.from("journal").insert({ lib, debit, credit, type }).select().single();
    if (error) return oops(error);
    setJournal((j) => [...j, { ...data, date: new Date(data.date_j).toLocaleDateString("fr-FR") }]);
  };

  const mouvAdd = async (type, produit, qte, motif) => {
    const { data, error } = await supabase.from("mouvements").insert({ type, produit, qte, motif }).select().single();
    if (error) return oops(error);
    setMouvements((m) => [{ ...data, date: dstr(data.date_m) }, ...m]);
  };

  const majStock = async (prodId, nouveauStock, nouveauCout) => {
    const patch = nouveauCout != null ? { stock: nouveauStock, cout: nouveauCout } : { stock: nouveauStock };
    const { error } = await supabase.from("produits").update(patch).eq("id", prodId);
    if (error) return oops(error);
    setProduits((ps) => ps.map((p) => (p.id === prodId ? { ...p, ...patch } : p)));
  };

  const encaisserVente = async (cart, mode, clientId, remise = 0) => {
    const lignes = cart.map((c) => ({ ...c }));
    const brut = lignes.reduce((s, l) => s + l.qte * l.prix, 0);
    remise = Math.min(Number(remise) || 0, brut);
    const total = brut - remise;
    const marge = lignes.reduce((s, l) => s + l.qte * (l.prix - l.cout), 0) - remise;
    const num = "T-" + String(ventes.length + 1).padStart(4, "0");
    const cli = mode === "credit" ? clients.find((c) => c.id === Number(clientId)) : null;
    const { data, error } = await supabase.from("ventes").insert({
      num, total, marge, mode, lignes, remise,
      client_id: cli ? cli.id : null,
      client_nom: cli ? cli.nom : "Client comptant",
    }).select().single();
    if (error) return oops(error);
    const vente = { ...data, date: dstr(data.date_v), client: data.client_nom };
    setVentes((v) => [vente, ...v]);
    for (const l of lignes) {
      const p = produits.find((x) => x.id === l.id);
      if (p) await majStock(p.id, Number(p.stock) - l.qte);
      await mouvAdd("Sortie", l.nom, l.qte, "Vente " + num);
    }
    if (cli) {
      const nc = Number(cli.credit) + total;
      const { error: e2 } = await supabase.from("clients").update({ credit: nc }).eq("id", cli.id);
      if (e2) return oops(e2);
      setClients((cs) => cs.map((c) => (c.id === cli.id ? { ...c, credit: nc } : c)));
      await journalAdd("Vente à crédit " + num + " — " + cli.nom, 0, 0, "Crédit client");
    } else {
      await journalAdd("Vente " + num + " (" + (MODES[mode] || mode) + ")", total, 0, "Vente");
    }
    setTicket(vente); setModeDoc("ticket");
  };

  const encaisserCredit = async (cli, montant) => {
    const nc = Math.max(0, Number(cli.credit) - montant);
    const { error } = await supabase.from("clients").update({ credit: nc }).eq("id", cli.id);
    if (error) return oops(error);
    setClients((cs) => cs.map((c) => (c.id === cli.id ? { ...c, credit: nc } : c)));
    await journalAdd("Règlement crédit — " + cli.nom, montant, 0, "Encaissement");
    return nc;
  };

  const receptionAchat = async ({ fourId, prodId, qte, coutU, paye }) => {
    const f = fours.find((x) => x.id === Number(fourId));
    const p = produits.find((x) => x.id === Number(prodId));
    if (!f || !p) return;
    const total = qte * coutU, reste = total - paye;
    const { data, error } = await supabase.from("achats").insert({
      fournisseur_id: f.id, fournisseur_nom: f.nom, produit: p.nom, qte, total, paye, reste,
    }).select().single();
    if (error) return oops(error);
    setAchats((a) => [{ ...data, date: dstr(data.date_a), four: f.nom }, ...a]);
    await majStock(p.id, Number(p.stock) + qte, coutU);
    await mouvAdd("Entrée", p.nom, qte, "Achat — " + f.nom);
    if (paye > 0) await journalAdd("Achat " + p.nom + " (" + f.nom + ")", 0, paye, "Achat");
    if (reste > 0) {
      const nd = Number(f.dette) + reste;
      const { error: e2 } = await supabase.from("fournisseurs").update({ dette: nd }).eq("id", f.id);
      if (e2) return oops(e2);
      setFours((fs) => fs.map((x) => (x.id === f.id ? { ...x, dette: nd } : x)));
    }
  };

  const reglerDette = async (f, montant) => {
    const nd = Math.max(0, Number(f.dette) - montant);
    const { error } = await supabase.from("fournisseurs").update({ dette: nd }).eq("id", f.id);
    if (error) return oops(error);
    setFours((fs) => fs.map((x) => (x.id === f.id ? { ...x, dette: nd } : x)));
    await journalAdd("Règlement dette — " + f.nom, 0, montant, "Paiement fournisseur");
  };

  const nouveauProduit = async (np) => {
    const { data, error } = await supabase.from("produits").insert({
      nom: np.nom, cat: np.cat || "Divers", prix: +np.prix, cout: +np.cout || 0, stock: +np.stock || 0, seuil: +np.seuil || 5, code_barre: np.code ? String(np.code).trim() : null, date_peremption: np.dper || null,
    }).select().single();
    if (error) return oops(error);
    setProduits((ps) => [...ps, data].sort((a, b) => a.nom.localeCompare(b.nom)));
  };

  const nouveauClient = async (nc) => {
    const { data, error } = await supabase.from("clients").insert({ nom: nc.nom, tel: nc.tel }).select().single();
    if (error) return oops(error);
    setClients((cs) => [...cs, data].sort((a, b) => a.nom.localeCompare(b.nom)));
  };

  const nouveauFour = async (nf) => {
    const { data, error } = await supabase.from("fournisseurs").insert({ nom: nf.nom, tel: nf.tel }).select().single();
    if (error) return oops(error);
    setFours((fs) => [...fs, data].sort((a, b) => a.nom.localeCompare(b.nom)));
  };

  const mouvementStock = async (p, type, qte, motif) => {
    if (type === "Sortie" && qte > Number(p.stock)) { alert("Stock insuffisant : " + p.stock + " disponibles."); return; }
    await majStock(p.id, Number(p.stock) + (type === "Entrée" ? qte : -qte));
    await mouvAdd(type, p.nom, qte, motif || (type === "Entrée" ? "Réapprovisionnement" : "Ajustement"));
  };

  const ajouterDepense = async (cat, lib, montant) => {
    await journalAdd("Dépense " + cat + (lib ? " — " + lib : ""), 0, montant, "Dépense");
  };

  const enregistrerCloture = async (fond, attendu, compte) => {
    const ecart = compte - attendu;
    const { data, error } = await supabase.from("clotures").insert({ fond, attendu, compte, ecart }).select().single();
    if (error) return oops(error);
    setClotures((cs) => [{ ...data, date: dstr(data.date_c) }, ...cs]);
  };

  const changerRole = async (id, nouveauRole) => {
    const { error } = await supabase.from("profils").update({ role: nouveauRole }).eq("id", id);
    if (error) return oops(error);
    setProfils((ps) => ps.map((x) => (x.id === id ? { ...x, role: nouveauRole } : x)));
  };

  /* ---------- Rendu ---------- */
  if (session === undefined) return <div className="app" style={{ alignItems: "center", justifyContent: "center" }}><style>{css}</style><div>Chargement…</div></div>;
  if (!session) return <Login />;

  const NAV_ALL = [
    ["dash", "◧", "Tableau de bord"],
    ["stock", "▤", "Stock"],
    ["ventes", "▦", "Ventes / Caisse"],
    ["clients", "◉", "Clients"],
    ["fours", "◈", "Fournisseurs"],
    ["compta", "◫", "Comptabilité"],
    ["equipe", "◎", "Équipe"],
  ];
  const NAV = role === "gerant" ? NAV_ALL : NAV_ALL.filter(([k]) => ["ventes", "clients"].includes(k));

  return (
    <div className="app">
      <style>{css}</style>
      <aside className="sidebar">
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid #1D4A3D" }}>
          <div className="display brandtxt" style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>
            Ma<span style={{ color: "var(--amber)" }}>Boutique</span>
          </div>
          <div className="brandtxt" style={{ fontSize: 11, color: "#8FA79A", marginTop: 2 }}>Gestion de commerce</div>
        </div>
        <nav style={{ marginTop: 10, flex: 1 }}>
          {NAV.map(([k, ic, lab]) => (
            <button key={k} className={"navbtn" + (page === k ? " on" : "")} onClick={() => setPage(k)}>
              <span style={{ fontSize: 16 }}>{ic}</span>
              <span className="navlabel">{lab}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid #1D4A3D" }}>
          <div className="brandtxt" style={{ fontSize: 11, color: "#8FA79A", marginBottom: 4 }}>
            Connecté : <b>{role === "gerant" ? "Gérant" : "Caissier"}</b>
          </div>
          <div className="brandtxt" style={{ fontSize: 11, color: "#8FA79A", marginBottom: 8 }}>
            Caisse : <b style={{ color: "var(--amber)" }}>{fmt(caisse)}</b>
          </div>
          <button className="navbtn" style={{ padding: "6px 0", fontSize: 13 }} onClick={() => supabase.auth.signOut()}>
            ⏻ <span className="navlabel">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto", maxHeight: "100vh" }}>
        {charge && <div style={{ padding: 8, fontSize: 13, color: "#7A8078" }}>Synchronisation des données…</div>}
        {page === "dash" && <Dash {...{ caJour, benefTotal, benefNet, valeurStock, creances, dettes, caisse, topProduits, alertesStock, alertesPeremption, clients, fours }} />}
        {page === "stock" && <Stock {...{ produits, mouvements, mouvementStock, nouveauProduit }} />}
        {page === "ventes" && <Ventes {...{ produits, clients, ventes, encaisserVente, setTicket, setModeDoc }} />}
        {page === "clients" && <Clients {...{ clients, ventes, encaisserCredit, nouveauClient }} />}
        {page === "fours" && <Fours {...{ fours, produits, achats, receptionAchat, reglerDette, nouveauFour }} />}
        {page === "compta" && <Compta {...{ journal, caisse, valeurStock, creances, dettes, ventes, clotures, ajouterDepense, enregistrerCloture, depensesTotal }} />}
        {page === "equipe" && role === "gerant" && <Equipe {...{ profils, changerRole, monId: session.user.id }} />}
      </main>

      {ticket && (
        <div className="overlay" onClick={() => setTicket(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>
              <button className={"btn sm " + (modeDoc === "ticket" ? "gold" : "ghost")} onClick={() => setModeDoc("ticket")} style={modeDoc !== "ticket" ? { background: "#fff" } : {}}>Ticket</button>
              <button className={"btn sm " + (modeDoc === "facture" ? "gold" : "ghost")} onClick={() => setModeDoc("facture")} style={modeDoc !== "facture" ? { background: "#fff" } : {}}>Facture</button>
              <button className="btn sm ghost" style={{ background: "#fff" }} onClick={() => window.print()}>🖨 Imprimer</button>
              <button className="btn sm ghost" style={{ background: "#fff" }} onClick={() => {
                const t = ticket;
                const ls = (t.lignes || []).map((l) => l.qte + " x " + l.nom + " = " + fmt(l.qte * l.prix)).join("%0A");
                const msg = "MA BOUTIQUE%0ATicket " + t.num + " — " + t.date + "%0A" + ls + (Number(t.remise) > 0 ? "%0ARemise : -" + fmt(t.remise) : "") + "%0ATOTAL : " + fmt(t.total) + "%0APaiement : " + (MODES[t.mode] || t.mode);
                window.open("https://wa.me/?text=" + msg, "_blank");
              }}>WhatsApp</button>
              <button className="btn sm" onClick={() => setTicket(null)}>Fermer ✕</button>
            </div>
            {modeDoc === "ticket" ? <Ticket v={ticket} /> : <Facture v={ticket} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ TABLEAU DE BORD ============ */
function Dash({ caJour, benefTotal, benefNet, valeurStock, creances, dettes, caisse, topProduits, alertesStock, alertesPeremption, clients, fours }) {
  const maxQ = topProduits.length ? topProduits[0][1] : 1;
  return (
    <div>
      <H1 t="Tableau de bord" s={"Situation du " + today()} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
        <Kpi lab="Ventes du jour" val={fmt(caJour)} />
        <Kpi lab="Bénéfice brut" val={fmt(benefTotal)} col="var(--green)" />
        <Kpi lab="Bénéfice net" val={fmt(benefNet)} col={benefNet >= 0 ? "var(--green)" : "var(--red)"} />
        <Kpi lab="Caisse" val={fmt(caisse)} col="var(--amber2)" />
        <Kpi lab="Valeur du stock" val={fmt(valeurStock)} />
        <Kpi lab="Créances clients" val={fmt(creances)} col={creances > 0 ? "var(--amber2)" : undefined} />
        <Kpi lab="Dettes fournisseurs" val={fmt(dettes)} col={dettes > 0 ? "var(--red)" : undefined} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="display" style={{ margin: "0 0 12px", fontSize: 16 }}>Produits les plus vendus</h3>
          {topProduits.length === 0 && <Empty t="Aucune vente enregistrée. Passe en caisse pour commencer." />}
          {topProduits.map(([nom, q]) => (
            <div key={nom} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{nom}</span><b>{q} vendus</b></div>
              <div style={{ background: "#EFECE1", borderRadius: 99, height: 8, marginTop: 4 }}>
                <div style={{ width: (q / maxQ) * 100 + "%", background: "var(--amber)", height: 8, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="display" style={{ margin: "0 0 12px", fontSize: 16 }}>Alertes</h3>
          {alertesStock.length === 0 && alertesPeremption.length === 0 && creances === 0 && dettes === 0 && <Empty t="Tout est en ordre." />}
          {alertesPeremption.map((p) => { const j = joursAvant(p.date_peremption); return <Alerte key={"per" + p.id} pill={j < 0 ? "bad" : "warn"} tag={j < 0 ? "Expiré" : "Péremption"} txt={`${p.nom} — ${j < 0 ? "expiré depuis " + (-j) + " j" : "expire dans " + j + " j"} (${dfr(p.date_peremption)})`} />; })}
          {alertesStock.map((p) => <Alerte key={p.id} pill="bad" tag="Stock bas" txt={`${p.nom} — reste ${p.stock} (seuil ${p.seuil})`} />)}
          {clients.filter((c) => Number(c.credit) > 0).map((c) => <Alerte key={c.id} pill="warn" tag="Crédit client" txt={`${c.nom} doit ${fmt(c.credit)}`} />)}
          {fours.filter((f) => Number(f.dette) > 0).map((f) => <Alerte key={f.id} pill="warn" tag="Dette" txt={`À payer à ${f.nom} : ${fmt(f.dette)}`} />)}
        </div>
      </div>
    </div>
  );
}

/* ============ STOCK ============ */
function Stock({ produits, mouvements, mouvementStock, nouveauProduit }) {
  const [tab, setTab] = useState("inv");
  const [f, setF] = useState({ prodId: "", type: "Entrée", qte: 1, motif: "" });
  const [np, setNp] = useState({ nom: "", cat: "Alimentaire", prix: "", cout: "", stock: "", seuil: 5, code: "", dper: "" });
  const [scanP, setScanP] = useState(false);
  const [busy, setBusy] = useState(false);

  const valider = async () => {
    const p = produits.find((x) => x.id === Number(f.prodId || produits[0]?.id));
    const q = Number(f.qte);
    if (!p || q <= 0) return;
    setBusy(true);
    await mouvementStock(p, f.type, q, f.motif);
    setF({ ...f, qte: 1, motif: "" }); setBusy(false);
  };
  const ajouter = async () => {
    if (!np.nom || !np.prix) return;
    setBusy(true);
    await nouveauProduit(np);
    setNp({ nom: "", cat: "Alimentaire", prix: "", cout: "", stock: "", seuil: 5, code: "", dper: "" }); setBusy(false);
  };

  return (
    <div>
      <H1 t="Stock" s="Inventaire, entrées et sorties" />
      {scanP && <Scanner onClose={() => setScanP(false)} onDetect={(code) => { setScanP(false); setNp((x) => ({ ...x, code })); setTab("new"); }} />}
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["inv", "Inventaire"], ["mvt", "Entrées / Sorties"], ["new", "Nouveau produit"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "inv" && (
        <div className="card">
          <div style={{ padding: "10px 14px 0", textAlign: "right" }}>
            <button className="btn sm ghost" onClick={() => exportCSV("inventaire", ["Produit", "Catégorie", "Code-barres", "Prix vente", "Coût", "Stock", "Seuil", "Péremption"], produits.map((p) => [p.nom, p.cat, p.code_barre || "", p.prix, p.cout, p.stock, p.seuil, p.date_peremption ? dfr(p.date_peremption) : ""]))}>Exporter Excel</button>
          </div>
          {produits.length === 0 ? <div style={{ padding: 20 }}><Empty t="Aucun produit. Ajoute ton premier produit dans l'onglet « Nouveau produit »." /></div> : (
            <table className="tb">
              <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix vente</th><th>Coût</th><th>Stock</th><th>Péremption</th><th>État</th></tr></thead>
              <tbody>
                {produits.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.nom}</b></td><td>{p.cat}</td><td>{fmt(p.prix)}</td><td>{fmt(p.cout)}</td>
                    <td><b>{Number(p.stock)}</b></td>
                    <td>{p.date_peremption ? (() => { const j = joursAvant(p.date_peremption); return <span className={"pill " + (j < 0 ? "bad" : j <= 30 ? "warn" : "ok")}>{dfr(p.date_peremption)}{j < 0 ? " · expiré" : j <= 30 ? " · " + j + " j" : ""}</span>; })() : "—"}</td>
                    <td>{Number(p.stock) <= Number(p.seuil) ? <span className="pill bad">Stock bas</span> : <span className="pill ok">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "mvt" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16, alignSelf: "start" }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Nouveau mouvement</h3>
            <Field l="Produit"><select className="inp" value={f.prodId} onChange={(e) => setF({ ...f, prodId: e.target.value })}>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom} (stock {Number(p.stock)})</option>)}
            </select></Field>
            <Field l="Type"><select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option>Entrée</option><option>Sortie</option>
            </select></Field>
            <Field l="Quantité"><input className="inp" type="number" min="1" value={f.qte} onChange={(e) => setF({ ...f, qte: e.target.value })} /></Field>
            <Field l="Motif"><input className="inp" placeholder="Ex : casse, réapprovisionnement…" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} /></Field>
            <button className="btn" style={{ width: "100%", marginTop: 6 }} disabled={busy} onClick={valider}>Enregistrer le mouvement</button>
          </div>
          <div className="card">
            <table className="tb">
              <thead><tr><th>Date</th><th>Type</th><th>Produit</th><th>Qté</th><th>Motif</th></tr></thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.date}</td>
                    <td><span className={"pill " + (m.type === "Entrée" ? "ok" : "warn")}>{m.type}</span></td>
                    <td>{m.produit}</td><td><b>{Number(m.qte)}</b></td><td>{m.motif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "new" && (
        <div className="card" style={{ padding: 18, maxWidth: 460 }}>
          <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Ajouter un produit</h3>
          <Field l="Nom du produit"><input className="inp" value={np.nom} onChange={(e) => setNp({ ...np, nom: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field l="Catégorie"><input className="inp" value={np.cat} onChange={(e) => setNp({ ...np, cat: e.target.value })} /></Field>
            <Field l="Seuil d'alerte"><input className="inp" type="number" value={np.seuil} onChange={(e) => setNp({ ...np, seuil: e.target.value })} /></Field>
            <Field l="Code-barres (optionnel)"><div style={{ display: "flex", gap: 6 }}><input className="inp" value={np.code} onChange={(e) => setNp({ ...np, code: e.target.value })} /><button className="btn sm" type="button" onClick={() => setScanP(true)}>Scanner</button></div></Field>
            <Field l="Prix de vente (F)"><input className="inp" type="number" value={np.prix} onChange={(e) => setNp({ ...np, prix: e.target.value })} /></Field>
            <Field l="Coût d'achat (F)"><input className="inp" type="number" value={np.cout} onChange={(e) => setNp({ ...np, cout: e.target.value })} /></Field>
            <Field l="Stock initial"><input className="inp" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} /></Field>
            <Field l="Date de péremption (optionnel)"><input className="inp" type="date" value={np.dper} onChange={(e) => setNp({ ...np, dper: e.target.value })} /></Field>
          </div>
          <button className="btn" style={{ marginTop: 8 }} disabled={busy} onClick={ajouter}>Ajouter au stock</button>
        </div>
      )}
    </div>
  );
}

/* ============ VENTES / CAISSE ============ */
function Ventes({ produits, clients, ventes, encaisserVente, setTicket, setModeDoc }) {
  const [tab, setTab] = useState("caisse");
  const [cart, setCart] = useState([]);
  const [mode, setMode] = useState("especes");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [remise, setRemise] = useState("");
  const [scan, setScan] = useState(false);
  const [busy, setBusy] = useState(false);

  const brut = cart.reduce((s, l) => s + l.qte * l.prix, 0);
  const total = Math.max(0, brut - (Number(remise) || 0));
  const add = (p) => {
    if (Number(p.stock) <= 0) return;
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      if (ex) {
        if (ex.qte >= Number(p.stock)) return c;
        return c.map((x) => (x.id === p.id ? { ...x, qte: x.qte + 1 } : x));
      }
      return [...c, { id: p.id, nom: p.nom, prix: Number(p.prix), cout: Number(p.cout), qte: 1 }];
    });
  };
  const setQ = (id, q) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qte: Math.max(1, Number(q) || 1) } : x)));
  const rm = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const payer = async () => {
    if (!cart.length || busy) return;
    if (mode === "credit" && !clientId && !clients.length) { alert("Ajoute d'abord un client pour vendre à crédit."); return; }
    setBusy(true);
    await encaisserVente(cart, mode, clientId || clients[0]?.id, Number(remise) || 0);
    setCart([]); setRemise(""); setBusy(false);
  };
  const list = produits.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()) || (p.code_barre || "").includes(search.trim()));

  return (
    <div>
      <H1 t="Ventes" s="Caisse, tickets et factures" />
      {scan && <Scanner onClose={() => setScan(false)} onDetect={(code) => {
        setScan(false);
        const p = produits.find((x) => (x.code_barre || "") === code);
        if (p) add(p); else { setSearch(code); alert("Aucun produit avec le code-barres : " + code); }
      }} />}
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["caisse", "Caisse"], ["hist", "Historique des ventes"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "caisse" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input className="inp" placeholder="Rechercher ou taper un code-barres puis Entrée…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { const p = produits.find((x) => (x.code_barre || "") !== "" && x.code_barre === search.trim()); if (p) { add(p); setSearch(""); } } }} />
              <button className="btn" onClick={() => setScan(true)}>Scanner</button>
            </div>
            {list.length === 0 && <Empty t="Aucun produit disponible. Ajoute des produits dans le module Stock." />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
              {list.map((p) => (
                <button key={p.id} onClick={() => add(p)} className="card" style={{ padding: 12, textAlign: "left", cursor: Number(p.stock) > 0 ? "pointer" : "not-allowed", opacity: Number(p.stock) > 0 ? 1 : 0.45 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nom}</div>
                  <div className="display" style={{ color: "var(--amber2)", fontWeight: 700, marginTop: 4 }}>{fmt(p.prix)}</div>
                  <div style={{ fontSize: 11.5, color: Number(p.stock) <= Number(p.seuil) ? "var(--red)" : "#7A8078", marginTop: 2 }}>Stock : {Number(p.stock)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16, alignSelf: "start", position: "sticky", top: 0 }}>
            <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Panier</h3>
            {cart.length === 0 && <Empty t="Clique sur un produit pour l'ajouter." />}
            {cart.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
                <div style={{ flex: 1 }}>{l.nom}<div style={{ color: "#7A8078", fontSize: 11.5 }}>{fmt(l.prix)}</div></div>
                <input className="inp" type="number" min="1" value={l.qte} onChange={(e) => setQ(l.id, e.target.value)} style={{ width: 54, padding: "5px 6px" }} />
                <button onClick={() => rm(l.id)} style={{ border: "none", background: "none", color: "var(--red)", cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
            ))}
            <div className="dash" />
            <Field l="Remise (F)"><input className="inp" type="number" min="0" value={remise} onChange={(e) => setRemise(e.target.value)} placeholder="0" /></Field>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <b>Total</b><b className="display" style={{ fontSize: 19 }}>{fmt(total)}</b>
            </div>
            <Field l="Mode de paiement">
              <select className="inp" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="especes">Espèces</option>
                <option value="orange">Orange Money</option>
                <option value="mtn">MTN MoMo</option>
                <option value="wave">Wave</option>
                <option value="credit">Crédit (à terme)</option>
              </select>
            </Field>
            {mode === "credit" && (
              <Field l="Client">
                <select className="inp" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </Field>
            )}
            <button className="btn gold" style={{ width: "100%", marginTop: 8, fontSize: 15 }} disabled={busy} onClick={payer}>
              {busy ? "Enregistrement…" : "Encaisser " + (total > 0 ? fmt(total) : "")}
            </button>
          </div>
        </div>
      )}

      {tab === "hist" && (
        <div className="card">
          <div style={{ padding: "10px 14px 0", textAlign: "right" }}>
            <button className="btn sm ghost" onClick={() => exportCSV("ventes", ["N°", "Date", "Client", "Articles", "Total", "Remise", "Paiement"], ventes.map((v) => [v.num, v.date, v.client, (v.lignes || []).reduce((s, l) => s + l.qte, 0), v.total, v.remise || 0, MODES[v.mode] || v.mode]))}>Exporter Excel</button>
          </div>
          {ventes.length === 0 && <div style={{ padding: 20 }}><Empty t="Aucune vente pour l'instant." /></div>}
          {ventes.length > 0 && (
            <table className="tb">
              <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Documents</th></tr></thead>
              <tbody>
                {ventes.map((v) => (
                  <tr key={v.id}>
                    <td><b>{v.num}</b></td><td>{v.date}</td><td>{v.client}</td>
                    <td>{(v.lignes || []).reduce((s, l) => s + l.qte, 0)}</td>
                    <td><b>{fmt(v.total)}</b></td>
                    <td><span className={"pill " + (v.mode === "credit" ? "warn" : "ok")}>{MODES[v.mode] || v.mode}</span></td>
                    <td>
                      <button className="btn sm ghost" style={{ marginRight: 6 }} onClick={() => { setTicket(v); setModeDoc("ticket"); }}>Ticket</button>
                      <button className="btn sm ghost" onClick={() => { setTicket(v); setModeDoc("facture"); }}>Facture</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ CLIENTS ============ */
function Clients({ clients, ventes, encaisserCredit, nouveauClient }) {
  const [sel, setSel] = useState(null);
  const [pay, setPay] = useState("");
  const [nc, setNc] = useState({ nom: "", tel: "" });
  const [busy, setBusy] = useState(false);
  const histo = sel ? ventes.filter((v) => v.client_id === sel.id || v.client === sel.nom) : [];

  return (
    <div>
      <H1 t="Clients" s="Historique d'achats et suivi des crédits" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div className="card">
          {clients.length === 0 ? <div style={{ padding: 20 }}><Empty t="Aucun client enregistré." /></div> : (
            <table className="tb">
              <thead><tr><th>Client</th><th>Téléphone</th><th>Crédit en cours</th><th></th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} style={{ background: sel?.id === c.id ? "#FBF7EA" : undefined }}>
                    <td><b>{c.nom}</b></td><td>{c.tel}</td>
                    <td>{Number(c.credit) > 0 ? <span className="pill warn">{fmt(c.credit)}</span> : <span className="pill ok">À jour</span>}</td>
                    <td>
                      <button className="btn sm ghost" onClick={() => setSel(c)}>Détails</button>
                      {Number(c.credit) > 0 && c.tel && (
                        <button className="btn sm gold" style={{ marginLeft: 6 }} onClick={() => window.open(waLink(c.tel, "Bonjour " + c.nom + ", rappel de MA BOUTIQUE : votre crédit en cours est de " + fmt(c.credit) + ". Merci de passer le régler quand vous le pouvez. Bonne journée !"), "_blank")}>Rappel WhatsApp</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Nouveau client</h3>
            <Field l="Nom"><input className="inp" value={nc.nom} onChange={(e) => setNc({ ...nc, nom: e.target.value })} /></Field>
            <Field l="Téléphone"><input className="inp" value={nc.tel} onChange={(e) => setNc({ ...nc, tel: e.target.value })} /></Field>
            <button className="btn" disabled={busy} onClick={async () => { if (!nc.nom) return; setBusy(true); await nouveauClient(nc); setNc({ nom: "", tel: "" }); setBusy(false); }}>Ajouter</button>
          </div>
          {sel && (
            <div className="card" style={{ padding: 16 }}>
              <h3 className="display" style={{ margin: "0 0 6px", fontSize: 15 }}>{sel.nom}</h3>
              <div style={{ fontSize: 13, color: "#7A8078" }}>{sel.tel}</div>
              <div style={{ margin: "10px 0", fontSize: 14 }}>
                Crédit en cours : <b style={{ color: Number(sel.credit) > 0 ? "var(--amber2)" : "var(--green)" }}>{fmt(sel.credit)}</b>
              </div>
              {Number(sel.credit) > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="inp" type="number" placeholder="Montant reçu" value={pay} onChange={(e) => setPay(e.target.value)} />
                  <button className="btn gold" disabled={busy} onClick={async () => { const m = Number(pay); if (m > 0) { setBusy(true); const nc2 = await encaisserCredit(sel, m); setSel({ ...sel, credit: nc2 }); setPay(""); setBusy(false); } }}>Encaisser</button>
                </div>
              )}
              <div className="dash" />
              <b style={{ fontSize: 13 }}>Historique des achats</b>
              {histo.length === 0 && <Empty t="Aucun achat enregistré." />}
              {histo.map((v) => (
                <div key={v.id} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0EDE3" }}>
                  <span>{v.num} · {v.date}</span><b>{fmt(v.total)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ FOURNISSEURS ============ */
function Fours({ fours, produits, achats, receptionAchat, reglerDette, nouveauFour }) {
  const [f, setF] = useState({ fourId: "", prodId: "", qte: 10, coutU: "", paye: "" });
  const [nf, setNf] = useState({ nom: "", tel: "" });
  const [reg, setReg] = useState({});
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <H1 t="Fournisseurs" s="Achats, réceptions et suivi des dettes" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Nouvel achat</h3>
            {(fours.length === 0 || produits.length === 0) && <Empty t="Ajoute d'abord un fournisseur et un produit." />}
            <Field l="Fournisseur"><select className="inp" value={f.fourId} onChange={(e) => setF({ ...f, fourId: e.target.value })}>
              <option value="">— choisir —</option>
              {fours.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select></Field>
            <Field l="Produit"><select className="inp" value={f.prodId} onChange={(e) => setF({ ...f, prodId: e.target.value })}>
              <option value="">— choisir —</option>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field l="Quantité"><input className="inp" type="number" value={f.qte} onChange={(e) => setF({ ...f, qte: e.target.value })} /></Field>
              <Field l="Coût unitaire (F)"><input className="inp" type="number" value={f.coutU} onChange={(e) => setF({ ...f, coutU: e.target.value })} /></Field>
            </div>
            <Field l={"Montant payé maintenant (total : " + fmt((Number(f.qte) || 0) * (Number(f.coutU) || 0)) + ")"}>
              <input className="inp" type="number" value={f.paye} onChange={(e) => setF({ ...f, paye: e.target.value })} />
            </Field>
            <button className="btn" style={{ width: "100%" }} disabled={busy} onClick={async () => {
              const qte = Number(f.qte), coutU = Number(f.coutU), paye = Number(f.paye) || 0;
              if (f.fourId && f.prodId && qte > 0 && coutU > 0 && paye <= qte * coutU) {
                setBusy(true); await receptionAchat({ ...f, qte, coutU, paye }); setF({ ...f, coutU: "", paye: "" }); setBusy(false);
              }
            }}>Réceptionner l'achat</button>
            <div style={{ fontSize: 11.5, color: "#7A8078", marginTop: 8 }}>Le reste non payé s'ajoute automatiquement à la dette du fournisseur.</div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Nouveau fournisseur</h3>
            <Field l="Nom"><input className="inp" value={nf.nom} onChange={(e) => setNf({ ...nf, nom: e.target.value })} /></Field>
            <Field l="Téléphone"><input className="inp" value={nf.tel} onChange={(e) => setNf({ ...nf, tel: e.target.value })} /></Field>
            <button className="btn" disabled={busy} onClick={async () => { if (!nf.nom) return; setBusy(true); await nouveauFour(nf); setNf({ nom: "", tel: "" }); setBusy(false); }}>Ajouter</button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            {fours.length === 0 ? <div style={{ padding: 20 }}><Empty t="Aucun fournisseur enregistré." /></div> : (
              <table className="tb">
                <thead><tr><th>Fournisseur</th><th>Téléphone</th><th>Dette</th><th>Règlement</th></tr></thead>
                <tbody>
                  {fours.map((x) => (
                    <tr key={x.id}>
                      <td><b>{x.nom}</b></td><td>{x.tel}</td>
                      <td>{Number(x.dette) > 0 ? <span className="pill bad">{fmt(x.dette)}</span> : <span className="pill ok">Soldé</span>}</td>
                      <td>
                        {Number(x.dette) > 0 && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input className="inp" type="number" placeholder="Montant" style={{ width: 110, padding: "5px 8px" }}
                              value={reg[x.id] || ""} onChange={(e) => setReg({ ...reg, [x.id]: e.target.value })} />
                            <button className="btn sm" disabled={busy} onClick={async () => { const m = Number(reg[x.id]); if (m > 0) { setBusy(true); await reglerDette(x, m); setReg({ ...reg, [x.id]: "" }); setBusy(false); } }}>Payer</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div style={{ padding: "12px 14px 0" }}><b style={{ fontSize: 14 }}>Historique des achats</b></div>
            {achats.length === 0 ? <div style={{ padding: 16 }}><Empty t="Aucun achat enregistré." /></div> : (
              <table className="tb">
                <thead><tr><th>Date</th><th>Fournisseur</th><th>Produit</th><th>Qté</th><th>Total</th><th>Payé</th><th>Reste</th></tr></thead>
                <tbody>
                  {achats.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td><td>{a.four}</td><td>{a.produit}</td><td>{Number(a.qte)}</td>
                      <td>{fmt(a.total)}</td><td>{fmt(a.paye)}</td>
                      <td>{Number(a.reste) > 0 ? <b style={{ color: "var(--red)" }}>{fmt(a.reste)}</b> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ COMPTABILITÉ ============ */
function Compta({ journal, caisse, valeurStock, creances, dettes, ventes, clotures, ajouterDepense, enregistrerCloture, depensesTotal }) {
  const [tab, setTab] = useState("journal");
  const [dep, setDep] = useState({ cat: "Loyer", lib: "", montant: "" });
  const [clo, setClo] = useState({ fond: "", compte: "" });
  const [impr, setImpr] = useState(false);
  const [busy, setBusy] = useState(false);
  const actif = caisse + valeurStock + creances;
  const capitaux = actif - dettes;

  const statsJour = useMemo(() => {
    const m = {};
    ventes.forEach((v) => { const d = (v.date || "").split(" ")[0]; if (d) m[d] = (m[d] || 0) + Number(v.total); });
    return Object.entries(m);
  }, [ventes]);
  const maxCA = Math.max(1, ...statsJour.map(([, v]) => v));

  const depenses = journal.filter((j) => j.type === "Dépense");

  /* Clôture : mouvements espèces de la journée */
  const jour = today();
  const jJour = journal.filter((j) => j.date === jour);
  const entreesEsp = jJour.filter((j) => (j.type === "Vente" && (j.lib || "").includes("Espèces")) || j.type === "Encaissement").reduce((s, j) => s + Number(j.debit), 0);
  const sortiesJour = jJour.filter((j) => ["Dépense", "Achat", "Paiement fournisseur"].includes(j.type)).reduce((s, j) => s + Number(j.credit), 0);
  const attendu = (Number(clo.fond) || 0) + entreesEsp - sortiesJour;
  const ecart = (Number(clo.compte) || 0) - attendu;
  const dejaCloture = clotures.some((c) => (c.date || "").startsWith(jour));

  return (
    <div>
      <H1 t="Comptabilité" s="Journal, bilan, statistiques, dépenses et clôture" />
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["journal", "Journal"], ["bilan", "Bilan"], ["stats", "Statistiques"], ["dep", "Dépenses"], ["clo", "Clôture de caisse"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "journal" && (
        <div className="card">
          <div style={{ padding: "10px 14px 0", textAlign: "right" }}>
            <button className="btn sm ghost" style={{ marginRight: 8 }} onClick={() => exportCSV("journal", ["Date", "Libellé", "Type", "Débit", "Crédit"], journal.map((j) => [j.date, j.lib, j.type, j.debit, j.credit]))}>Exporter Excel</button>
            <button className="btn sm ghost" onClick={() => setImpr(true)}>Imprimer / PDF</button>
          </div>
          <table className="tb">
            <thead><tr><th>Date</th><th>Libellé</th><th>Type</th><th style={{ textAlign: "right" }}>Entrée (débit)</th><th style={{ textAlign: "right" }}>Sortie (crédit)</th></tr></thead>
            <tbody>
              {[...journal].reverse().map((j) => (
                <tr key={j.id}>
                  <td>{j.date}</td><td>{j.lib}</td><td><span className="pill ok">{j.type}</span></td>
                  <td style={{ textAlign: "right", color: "var(--green)" }}>{Number(j.debit) ? "+" + fmt(j.debit) : ""}</td>
                  <td style={{ textAlign: "right", color: "var(--red)" }}>{Number(j.credit) ? "−" + fmt(j.credit) : ""}</td>
                </tr>
              ))}
              <tr style={{ background: "#FBF7EA" }}>
                <td colSpan={3}><b>Solde de caisse</b></td>
                <td colSpan={2} style={{ textAlign: "right" }}><b className="display" style={{ fontSize: 16 }}>{fmt(caisse)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "bilan" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 760 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Actif</h3>
            <Ligne l="Caisse (trésorerie)" v={fmt(caisse)} />
            <Ligne l="Stock (au coût d'achat)" v={fmt(valeurStock)} />
            <Ligne l="Créances clients" v={fmt(creances)} />
            <div className="dash" />
            <Ligne l={<b>Total actif</b>} v={<b className="display">{fmt(actif)}</b>} />
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Passif</h3>
            <Ligne l="Dettes fournisseurs" v={fmt(dettes)} />
            <Ligne l="Capitaux propres" v={fmt(capitaux)} />
            <div className="dash" />
            <Ligne l={<b>Total passif</b>} v={<b className="display">{fmt(actif)}</b>} />
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="card" style={{ padding: 18, maxWidth: 640 }}>
          <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Chiffre d'affaires par jour</h3>
          {statsJour.length === 0 && <Empty t="Les statistiques apparaîtront après tes premières ventes." />}
          {statsJour.map(([d, v]) => (
            <div key={d} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{d}</span><b>{fmt(v)}</b></div>
              <div style={{ background: "#EFECE1", height: 10, borderRadius: 99, marginTop: 4 }}>
                <div style={{ width: (v / maxCA) * 100 + "%", background: "var(--green)", height: 10, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "dep" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16, alignSelf: "start" }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Nouvelle dépense</h3>
            <Field l="Catégorie">
              <select className="inp" value={dep.cat} onChange={(e) => setDep({ ...dep, cat: e.target.value })}>
                {["Loyer", "Salaires", "Électricité", "Eau", "Transport", "Internet / Téléphone", "Impôts & taxes", "Entretien", "Autre"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field l="Détail (optionnel)"><input className="inp" value={dep.lib} onChange={(e) => setDep({ ...dep, lib: e.target.value })} placeholder="Ex : loyer du mois de juillet" /></Field>
            <Field l="Montant (F)"><input className="inp" type="number" min="0" value={dep.montant} onChange={(e) => setDep({ ...dep, montant: e.target.value })} /></Field>
            <button className="btn" style={{ width: "100%" }} disabled={busy} onClick={async () => {
              const m = Number(dep.montant);
              if (m > 0) { setBusy(true); await ajouterDepense(dep.cat, dep.lib, m); setDep({ ...dep, lib: "", montant: "" }); setBusy(false); }
            }}>Enregistrer la dépense</button>
            <div className="dash" />
            <Ligne l={<b>Total des dépenses</b>} v={<b style={{ color: "var(--red)" }}>{fmt(depensesTotal)}</b>} />
          </div>
          <div className="card">
            {depenses.length === 0 ? <div style={{ padding: 20 }}><Empty t="Aucune dépense enregistrée." /></div> : (
              <table className="tb">
                <thead><tr><th>Date</th><th>Libellé</th><th style={{ textAlign: "right" }}>Montant</th></tr></thead>
                <tbody>
                  {[...depenses].reverse().map((j) => (
                    <tr key={j.id}><td>{j.date}</td><td>{j.lib}</td><td style={{ textAlign: "right", color: "var(--red)" }}>−{fmt(j.credit)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "clo" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16, alignSelf: "start" }}>
            <h3 className="display" style={{ margin: "0 0 6px", fontSize: 15 }}>Clôture du {jour}</h3>
            {dejaCloture && <div className="pill warn" style={{ marginBottom: 10 }}>Une clôture existe déjà aujourd'hui</div>}
            <Field l="Fond de caisse du matin (F)"><input className="inp" type="number" value={clo.fond} onChange={(e) => setClo({ ...clo, fond: e.target.value })} /></Field>
            <Ligne l="+ Entrées espèces du jour" v={fmt(entreesEsp)} />
            <Ligne l="− Sorties du jour (dépenses, achats…)" v={fmt(sortiesJour)} />
            <div className="dash" />
            <Ligne l={<b>Espèces attendues en caisse</b>} v={<b className="display">{fmt(attendu)}</b>} />
            <Field l="Montant réellement compté (F)"><input className="inp" type="number" value={clo.compte} onChange={(e) => setClo({ ...clo, compte: e.target.value })} /></Field>
            {clo.compte !== "" && (
              <div style={{ marginBottom: 10, fontSize: 14 }}>
                Écart : <b style={{ color: ecart === 0 ? "var(--green)" : "var(--red)" }}>{ecart > 0 ? "+" : ""}{fmt(ecart)}</b>
                {ecart === 0 ? " ✓ caisse juste" : ecart < 0 ? " (manquant)" : " (surplus)"}
              </div>
            )}
            <button className="btn gold" style={{ width: "100%" }} disabled={busy || clo.compte === ""} onClick={async () => {
              setBusy(true);
              await enregistrerCloture(Number(clo.fond) || 0, attendu, Number(clo.compte) || 0);
              setClo({ fond: "", compte: "" }); setBusy(false);
            }}>Clôturer la journée</button>
          </div>
          <div className="card">
            <div style={{ padding: "12px 14px 0" }}><b style={{ fontSize: 14 }}>Historique des clôtures</b></div>
            {clotures.length === 0 ? <div style={{ padding: 16 }}><Empty t="Aucune clôture enregistrée." /></div> : (
              <table className="tb">
                <thead><tr><th>Date</th><th>Fond</th><th>Attendu</th><th>Compté</th><th>Écart</th></tr></thead>
                <tbody>
                  {clotures.map((c) => (
                    <tr key={c.id}>
                      <td>{c.date}</td><td>{fmt(c.fond)}</td><td>{fmt(c.attendu)}</td><td>{fmt(c.compte)}</td>
                      <td><b style={{ color: Number(c.ecart) === 0 ? "var(--green)" : "var(--red)" }}>{Number(c.ecart) > 0 ? "+" : ""}{fmt(c.ecart)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {impr && (
        <div className="overlay" onClick={() => setImpr(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 10, padding: 24, width: "92%", maxWidth: 720, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>MA BOUTIQUE — Journal de caisse</div>
                <div style={{ fontSize: 12, color: "#7A8078" }}>Édité le {today()}</div>
              </div>
              <div>
                <button className="btn sm gold" style={{ marginRight: 6 }} onClick={() => window.print()}>Imprimer / PDF</button>
                <button className="btn sm" onClick={() => setImpr(false)}>Fermer</button>
              </div>
            </div>
            <table className="tb">
              <thead><tr><th>Date</th><th>Libellé</th><th>Type</th><th style={{ textAlign: "right" }}>Débit</th><th style={{ textAlign: "right" }}>Crédit</th></tr></thead>
              <tbody>
                {journal.map((j) => (
                  <tr key={j.id}><td>{j.date}</td><td>{j.lib}</td><td>{j.type}</td>
                    <td style={{ textAlign: "right" }}>{Number(j.debit) ? fmt(j.debit) : ""}</td>
                    <td style={{ textAlign: "right" }}>{Number(j.credit) ? fmt(j.credit) : ""}</td></tr>
                ))}
                <tr style={{ background: "#FBF7EA" }}><td colSpan={3}><b>Solde de caisse</b></td><td colSpan={2} style={{ textAlign: "right" }}><b>{fmt(caisse)}</b></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ DOCUMENTS ============ */
function Ticket({ v }) {
  return (
    <div className="ticket">
      <div style={{ textAlign: "center" }}>
        <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>MA BOUTIQUE</div>
        <div style={{ fontSize: 11 }}>Abidjan · Tél : 07 00 00 00 00</div>
      </div>
      <div className="dash" />
      <div>Ticket : <b>{v.num}</b></div>
      <div>Date : {v.date}</div>
      <div>Client : {v.client}</div>
      <div className="dash" />
      {(v.lignes || []).map((l) => (
        <div key={l.id} style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{l.qte} × {l.nom}</span><span>{fmt(l.qte * l.prix)}</span>
        </div>
      ))}
      <div className="dash" />
      {Number(v.remise) > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Remise</span><span>−{fmt(v.remise)}</span></div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
        <b>TOTAL</b><b>{fmt(v.total)}</b>
      </div>
      <div style={{ fontSize: 11, marginTop: 4 }}>Paiement : {MODES[v.mode] || v.mode}</div>
      <div className="dash" />
      <div style={{ textAlign: "center", fontSize: 11 }}>Merci de votre visite !</div>
    </div>
  );
}

function Facture({ v }) {
  return (
    <div style={{ background: "#fff", width: 460, padding: 28, borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,.25)", fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>MA BOUTIQUE</div>
          <div style={{ color: "#7A8078", fontSize: 12 }}>Abidjan · 07 00 00 00 00</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 700, color: "var(--amber2)" }}>FACTURE</div>
          <div>N° {(v.num || "").replace("T-", "F-")}</div>
          <div style={{ fontSize: 12 }}>{v.date}</div>
        </div>
      </div>
      <div style={{ margin: "14px 0 10px" }}>Facturé à : <b>{v.client}</b></div>
      <table className="tb" style={{ border: "1px solid var(--line)", borderRadius: 6 }}>
        <thead><tr><th>Désignation</th><th>Qté</th><th style={{ textAlign: "right" }}>P.U.</th><th style={{ textAlign: "right" }}>Montant</th></tr></thead>
        <tbody>
          {(v.lignes || []).map((l) => (
            <tr key={l.id}><td>{l.nom}</td><td>{l.qte}</td><td style={{ textAlign: "right" }}>{fmt(l.prix)}</td><td style={{ textAlign: "right" }}>{fmt(l.qte * l.prix)}</td></tr>
          ))}
          <tr style={{ background: "#FBF7EA" }}>
            <td colSpan={3}><b>Total à payer</b></td>
            <td style={{ textAlign: "right" }}><b className="display" style={{ fontSize: 15 }}>{fmt(v.total)}</b></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 12, fontSize: 12, color: "#7A8078" }}>
        Mode de règlement : {MODES[v.mode] || v.mode}{Number(v.remise) > 0 ? " · Remise accordée : " + fmt(v.remise) : ""} · Arrêtée la présente facture à la somme de {fmt(v.total)}.
      </div>
    </div>
  );
}

/* ============ SCANNER CODE-BARRES ============ */
function Scanner({ onDetect, onClose }) {
  const [err, setErr] = useState("");
  useEffect(() => {
    let stream, timer, fini = false;
    const video = document.getElementById("scanvid");
    (async () => {
      try {
        if (!("BarcodeDetector" in window)) {
          setErr("Le scanner n'est pas supporté par ce navigateur. Utilise Google Chrome (Android ou PC récent), ou saisis le code manuellement.");
          return;
        }
        const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        await video.play();
        timer = setInterval(async () => {
          if (fini) return;
          try {
            const codes = await det.detect(video);
            if (codes.length) { fini = true; onDetect(codes[0].rawValue); }
          } catch {}
        }, 350);
      } catch (e) { setErr("Caméra inaccessible : " + (e.message || e)); }
    })();
    return () => { fini = true; if (timer) clearInterval(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);
  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 16, width: 340 }}>
        <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Scanner un code-barres</h3>
        {err ? <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div> : (
          <>
            <video id="scanvid" style={{ width: "100%", borderRadius: 8, background: "#000" }} muted playsInline />
            <div style={{ fontSize: 12, color: "#7A8078", marginTop: 6 }}>Place le code-barres devant la caméra…</div>
          </>
        )}
        <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

/* ============ ÉQUIPE ============ */
function Equipe({ profils, changerRole, monId }) {
  return (
    <div>
      <H1 t="Équipe" s="Comptes utilisateurs et rôles" />
      <div className="card" style={{ maxWidth: 640 }}>
        <table className="tb">
          <thead><tr><th>E-mail</th><th>Rôle</th></tr></thead>
          <tbody>
            {profils.map((p) => (
              <tr key={p.id}>
                <td>{p.email} {p.id === monId && <span className="pill ok" style={{ marginLeft: 6 }}>Toi</span>}</td>
                <td>
                  <select className="inp" style={{ width: 150 }} value={p.role} disabled={p.id === monId}
                    onChange={(e) => changerRole(p.id, e.target.value)}>
                    <option value="gerant">Gérant</option>
                    <option value="caissier">Caissier</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 13, color: "#7A8078", marginTop: 12, maxWidth: 640 }}>
        Pour ajouter un caissier : il crée simplement son compte sur la page de connexion de l'application, puis il apparaît ici avec le rôle Caissier (accès limité à la caisse et aux clients). Tu peux ensuite changer son rôle à tout moment.
      </div>
    </div>
  );
}

/* ============ Petits composants ============ */
const H1 = ({ t, s }) => (
  <div style={{ marginBottom: 18 }}>
    <h1 className="display" style={{ margin: 0, fontSize: 24 }}>{t}</h1>
    <div style={{ color: "#7A8078", fontSize: 13, marginTop: 2 }}>{s}</div>
  </div>
);
const Kpi = ({ lab, val, col }) => (
  <div className="card kpi"><div className="lab">{lab}</div><div className="val" style={{ color: col }}>{val}</div></div>
);
const Field = ({ l, children }) => (
  <label style={{ display: "block", marginBottom: 10 }}>
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#4A5049" }}>{l}</div>{children}
  </label>
);
const Empty = ({ t }) => <div style={{ fontSize: 13, color: "#9AA096", padding: "6px 0" }}>{t}</div>;
const Alerte = ({ pill, tag, txt }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #F0EDE3", fontSize: 13 }}>
    <span className={"pill " + pill}>{tag}</span><span>{txt}</span>
  </div>
);
const Ligne = ({ l, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
    <span>{l}</span><span>{v}</span>
  </div>
);
