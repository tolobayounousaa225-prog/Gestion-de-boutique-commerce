import { useState, useMemo } from "react";

/* ============================================================
   GESTION BOUTIQUE — Prototype complet
   Modules : Tableau de bord, Stock, Ventes, Clients,
   Fournisseurs, Comptabilité
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
@media(max-width:860px){.sidebar{width:64px}.navlabel{display:none}.brandtxt{display:none}}
`;

/* ---------- Données de démarrage ---------- */
const P0 = [
  { id: 1, nom: "Riz parfumé 25kg", cat: "Alimentaire", prix: 17500, cout: 15000, stock: 24, seuil: 10 },
  { id: 2, nom: "Huile végétale 1L", cat: "Alimentaire", prix: 1500, cout: 1200, stock: 48, seuil: 20 },
  { id: 3, nom: "Sucre 1kg", cat: "Alimentaire", prix: 800, cout: 650, stock: 6, seuil: 15 },
  { id: 4, nom: "Savon de ménage", cat: "Hygiène", prix: 500, cout: 350, stock: 60, seuil: 24 },
  { id: 5, nom: "Lait en poudre 400g", cat: "Alimentaire", prix: 2200, cout: 1800, stock: 18, seuil: 10 },
  { id: 6, nom: "Spaghetti 500g", cat: "Alimentaire", prix: 600, cout: 450, stock: 72, seuil: 30 },
  { id: 7, nom: "Concentré tomate 400g", cat: "Alimentaire", prix: 700, cout: 520, stock: 4, seuil: 12 },
  { id: 8, nom: "Boisson gazeuse 1,5L", cat: "Boissons", prix: 1000, cout: 750, stock: 36, seuil: 12 },
];
const C0 = [
  { id: 1, nom: "Mme Koné Awa", tel: "07 08 45 12 33", credit: 12500 },
  { id: 2, nom: "M. Traoré Issa", tel: "05 66 90 21 04", credit: 0 },
  { id: 3, nom: "Restaurant Chez Tantie", tel: "01 42 77 88 90", credit: 34000 },
];
const F0 = [
  { id: 1, nom: "SODICOM Distribution", tel: "27 22 41 55 60", dette: 85000 },
  { id: 2, nom: "Ets Ouattara & Fils", tel: "07 79 12 40 18", dette: 0 },
];

const fmt = (n) => (n || 0).toLocaleString("fr-FR") + " F";
const today = () => new Date().toLocaleDateString("fr-FR");
const now = () =>
  new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

let seq = 100;
const nid = () => ++seq;

export default function App() {
  const [page, setPage] = useState("dash");
  const [produits, setProduits] = useState(P0);
  const [clients, setClients] = useState(C0);
  const [fours, setFours] = useState(F0);
  const [mouvements, setMouvements] = useState([
    { id: 1, date: today() + " 08:15", type: "Entrée", produit: "Riz parfumé 25kg", qte: 10, motif: "Achat fournisseur" },
    { id: 2, date: today() + " 09:02", type: "Sortie", produit: "Sucre 1kg", qte: 4, motif: "Vente" },
  ]);
  const [ventes, setVentes] = useState([]);
  const [achats, setAchats] = useState([]);
  const [journal, setJournal] = useState([
    { id: 1, date: today(), lib: "Solde initial caisse", debit: 150000, credit: 0, type: "Caisse" },
  ]);
  const [ticket, setTicket] = useState(null); // vente affichée en ticket/facture
  const [modeDoc, setModeDoc] = useState("ticket");

  /* ---------- Calculs globaux ---------- */
  const caisse = useMemo(() => journal.reduce((s, j) => s + j.debit - j.credit, 0), [journal]);
  const valeurStock = useMemo(() => produits.reduce((s, p) => s + p.stock * p.cout, 0), [produits]);
  const creances = clients.reduce((s, c) => s + c.credit, 0);
  const dettes = fours.reduce((s, f) => s + f.dette, 0);
  const alertesStock = produits.filter((p) => p.stock <= p.seuil);

  const caJour = ventes.filter((v) => v.date.startsWith(today())).reduce((s, v) => s + v.total, 0);
  const benefTotal = ventes.reduce((s, v) => s + v.marge, 0);

  const topProduits = useMemo(() => {
    const m = {};
    ventes.forEach((v) => v.lignes.forEach((l) => (m[l.nom] = (m[l.nom] || 0) + l.qte)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [ventes]);

  /* ---------- Actions ---------- */
  const journalAdd = (lib, debit, credit, type) =>
    setJournal((j) => [...j, { id: nid(), date: today(), lib, debit, credit, type }]);

  const mouvAdd = (type, produit, qte, motif) =>
    setMouvements((m) => [{ id: nid(), date: now(), type, produit, qte, motif }, ...m]);

  const encaisserVente = (cart, mode, clientId) => {
    const lignes = cart.map((c) => ({ ...c }));
    const total = lignes.reduce((s, l) => s + l.qte * l.prix, 0);
    const marge = lignes.reduce((s, l) => s + l.qte * (l.prix - l.cout), 0);
    const num = "T-" + String(ventes.length + 1).padStart(4, "0");
    const cli = clients.find((c) => c.id === Number(clientId));
    const vente = { id: nid(), num, date: now(), lignes, total, marge, mode, client: cli ? cli.nom : "Client comptant" };
    setVentes((v) => [vente, ...v]);
    setProduits((ps) => ps.map((p) => {
      const l = lignes.find((x) => x.id === p.id);
      return l ? { ...p, stock: p.stock - l.qte } : p;
    }));
    lignes.forEach((l) => mouvAdd("Sortie", l.nom, l.qte, "Vente " + num));
    if (mode === "credit" && cli) {
      setClients((cs) => cs.map((c) => (c.id === cli.id ? { ...c, credit: c.credit + total } : c)));
      journalAdd("Vente à crédit " + num + " — " + cli.nom, 0, 0, "Crédit client");
    } else {
      journalAdd("Vente " + num, total, 0, "Vente");
    }
    setTicket(vente);
    setModeDoc("ticket");
  };

  const encaisserCredit = (cli, montant) => {
    setClients((cs) => cs.map((c) => (c.id === cli.id ? { ...c, credit: Math.max(0, c.credit - montant) } : c)));
    journalAdd("Règlement crédit — " + cli.nom, montant, 0, "Encaissement");
  };

  const receptionAchat = ({ fourId, prodId, qte, coutU, paye }) => {
    const f = fours.find((x) => x.id === Number(fourId));
    const p = produits.find((x) => x.id === Number(prodId));
    const total = qte * coutU;
    const reste = total - paye;
    setProduits((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: x.stock + qte, cout: coutU } : x)));
    mouvAdd("Entrée", p.nom, qte, "Achat — " + f.nom);
    setAchats((a) => [{ id: nid(), date: now(), four: f.nom, produit: p.nom, qte, total, paye, reste }, ...a]);
    if (paye > 0) journalAdd("Achat " + p.nom + " (" + f.nom + ")", 0, paye, "Achat");
    if (reste > 0) setFours((fs) => fs.map((x) => (x.id === f.id ? { ...x, dette: x.dette + reste } : x)));
  };

  const reglerDette = (f, montant) => {
    setFours((fs) => fs.map((x) => (x.id === f.id ? { ...x, dette: Math.max(0, x.dette - montant) } : x)));
    journalAdd("Règlement dette — " + f.nom, 0, montant, "Paiement fournisseur");
  };

  const NAV = [
    ["dash", "◧", "Tableau de bord"],
    ["stock", "▤", "Stock"],
    ["ventes", "▦", "Ventes / Caisse"],
    ["clients", "◉", "Clients"],
    ["fours", "◈", "Fournisseurs"],
    ["compta", "◫", "Comptabilité"],
  ];

  return (
    <div className="app">
      <style>{css}</style>

      {/* ===== BARRE LATÉRALE ===== */}
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
        <div className="brandtxt" style={{ padding: 16, fontSize: 11, color: "#8FA79A" }}>
          Caisse : <b style={{ color: "var(--amber)" }}>{fmt(caisse)}</b>
        </div>
      </aside>

      {/* ===== CONTENU ===== */}
      <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "dash" && (
          <Dash {...{ caJour, benefTotal, valeurStock, creances, dettes, caisse, topProduits, alertesStock, clients, fours }} />
        )}
        {page === "stock" && <Stock {...{ produits, setProduits, mouvements, mouvAdd }} />}
        {page === "ventes" && <Ventes {...{ produits, clients, ventes, encaisserVente, setTicket, setModeDoc }} />}
        {page === "clients" && <Clients {...{ clients, setClients, ventes, encaisserCredit }} />}
        {page === "fours" && <Fours {...{ fours, setFours, produits, achats, receptionAchat, reglerDette }} />}
        {page === "compta" && <Compta {...{ journal, caisse, valeurStock, creances, dettes, ventes }} />}
      </main>

      {/* ===== TICKET / FACTURE ===== */}
      {ticket && (
        <div className="overlay" onClick={() => setTicket(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>
              <button className={"btn sm " + (modeDoc === "ticket" ? "gold" : "ghost")} onClick={() => setModeDoc("ticket")} style={modeDoc !== "ticket" ? { background: "#fff" } : {}}>Ticket</button>
              <button className={"btn sm " + (modeDoc === "facture" ? "gold" : "ghost")} onClick={() => setModeDoc("facture")} style={modeDoc !== "facture" ? { background: "#fff" } : {}}>Facture</button>
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
function Dash({ caJour, benefTotal, valeurStock, creances, dettes, caisse, topProduits, alertesStock, clients, fours }) {
  const maxQ = topProduits.length ? topProduits[0][1] : 1;
  return (
    <div>
      <H1 t="Tableau de bord" s={"Situation du " + today()} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
        <Kpi lab="Ventes du jour" val={fmt(caJour)} />
        <Kpi lab="Bénéfice cumulé" val={fmt(benefTotal)} col="var(--green)" />
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{nom}</span><b>{q} vendus</b>
              </div>
              <div style={{ background: "#EFECE1", borderRadius: 99, height: 8, marginTop: 4 }}>
                <div style={{ width: (q / maxQ) * 100 + "%", background: "var(--amber)", height: 8, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="display" style={{ margin: "0 0 12px", fontSize: 16 }}>Alertes</h3>
          {alertesStock.length === 0 && creances === 0 && dettes === 0 && <Empty t="Tout est en ordre." />}
          {alertesStock.map((p) => (
            <Alerte key={p.id} pill="bad" tag="Stock bas" txt={`${p.nom} — reste ${p.stock} (seuil ${p.seuil})`} />
          ))}
          {clients.filter((c) => c.credit > 0).map((c) => (
            <Alerte key={c.id} pill="warn" tag="Crédit client" txt={`${c.nom} doit ${fmt(c.credit)}`} />
          ))}
          {fours.filter((f) => f.dette > 0).map((f) => (
            <Alerte key={f.id} pill="warn" tag="Dette" txt={`À payer à ${f.nom} : ${fmt(f.dette)}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ STOCK ============ */
function Stock({ produits, setProduits, mouvements, mouvAdd }) {
  const [tab, setTab] = useState("inv");
  const [f, setF] = useState({ prodId: produits[0]?.id, type: "Entrée", qte: 1, motif: "" });
  const [np, setNp] = useState({ nom: "", cat: "Alimentaire", prix: "", cout: "", stock: "", seuil: 5 });

  const valider = () => {
    const p = produits.find((x) => x.id === Number(f.prodId));
    const q = Number(f.qte);
    if (!p || q <= 0) return;
    if (f.type === "Sortie" && q > p.stock) { alert("Stock insuffisant : " + p.stock + " disponibles."); return; }
    setProduits((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: x.stock + (f.type === "Entrée" ? q : -q) } : x)));
    mouvAdd(f.type, p.nom, q, f.motif || (f.type === "Entrée" ? "Réapprovisionnement" : "Ajustement"));
    setF({ ...f, qte: 1, motif: "" });
  };

  const ajouter = () => {
    if (!np.nom || !np.prix) return;
    setProduits((ps) => [...ps, { id: nid(), nom: np.nom, cat: np.cat, prix: +np.prix, cout: +np.cout || 0, stock: +np.stock || 0, seuil: +np.seuil || 5 }]);
    setNp({ nom: "", cat: "Alimentaire", prix: "", cout: "", stock: "", seuil: 5 });
  };

  return (
    <div>
      <H1 t="Stock" s="Inventaire, entrées et sorties" />
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["inv", "Inventaire"], ["mvt", "Entrées / Sorties"], ["new", "Nouveau produit"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "inv" && (
        <div className="card">
          <table className="tb">
            <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix vente</th><th>Coût</th><th>Stock</th><th>État</th></tr></thead>
            <tbody>
              {produits.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.nom}</b></td><td>{p.cat}</td><td>{fmt(p.prix)}</td><td>{fmt(p.cout)}</td>
                  <td><b>{p.stock}</b></td>
                  <td>{p.stock <= p.seuil ? <span className="pill bad">Stock bas</span> : <span className="pill ok">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "mvt" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16, alignSelf: "start" }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Nouveau mouvement</h3>
            <Field l="Produit"><select className="inp" value={f.prodId} onChange={(e) => setF({ ...f, prodId: e.target.value })}>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom} (stock {p.stock})</option>)}
            </select></Field>
            <Field l="Type"><select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option>Entrée</option><option>Sortie</option>
            </select></Field>
            <Field l="Quantité"><input className="inp" type="number" min="1" value={f.qte} onChange={(e) => setF({ ...f, qte: e.target.value })} /></Field>
            <Field l="Motif"><input className="inp" placeholder="Ex : casse, réapprovisionnement…" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} /></Field>
            <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={valider}>Enregistrer le mouvement</button>
          </div>
          <div className="card">
            <table className="tb">
              <thead><tr><th>Date</th><th>Type</th><th>Produit</th><th>Qté</th><th>Motif</th></tr></thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.date}</td>
                    <td><span className={"pill " + (m.type === "Entrée" ? "ok" : "warn")}>{m.type}</span></td>
                    <td>{m.produit}</td><td><b>{m.qte}</b></td><td>{m.motif}</td>
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
            <Field l="Prix de vente (F)"><input className="inp" type="number" value={np.prix} onChange={(e) => setNp({ ...np, prix: e.target.value })} /></Field>
            <Field l="Coût d'achat (F)"><input className="inp" type="number" value={np.cout} onChange={(e) => setNp({ ...np, cout: e.target.value })} /></Field>
            <Field l="Stock initial"><input className="inp" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} /></Field>
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={ajouter}>Ajouter au stock</button>
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
  const [clientId, setClientId] = useState(clients[0]?.id);
  const [search, setSearch] = useState("");

  const total = cart.reduce((s, l) => s + l.qte * l.prix, 0);
  const add = (p) => {
    if (p.stock <= 0) return;
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      if (ex) {
        if (ex.qte >= p.stock) return c;
        return c.map((x) => (x.id === p.id ? { ...x, qte: x.qte + 1 } : x));
      }
      return [...c, { id: p.id, nom: p.nom, prix: p.prix, cout: p.cout, qte: 1 }];
    });
  };
  const setQ = (id, q) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qte: Math.max(1, Number(q) || 1) } : x)));
  const rm = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const payer = () => { if (!cart.length) return; encaisserVente(cart, mode, clientId); setCart([]); };

  const list = produits.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <H1 t="Ventes" s="Caisse, tickets et factures" />
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["caisse", "Caisse"], ["hist", "Historique des ventes"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "caisse" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div>
            <input className="inp" placeholder="Rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
              {list.map((p) => (
                <button key={p.id} onClick={() => add(p)} className="card" style={{ padding: 12, textAlign: "left", cursor: p.stock > 0 ? "pointer" : "not-allowed", opacity: p.stock > 0 ? 1 : 0.45, border: "1px solid var(--line)" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nom}</div>
                  <div className="display" style={{ color: "var(--amber2)", fontWeight: 700, marginTop: 4 }}>{fmt(p.prix)}</div>
                  <div style={{ fontSize: 11.5, color: p.stock <= p.seuil ? "var(--red)" : "#7A8078", marginTop: 2 }}>Stock : {p.stock}</div>
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <b>Total</b><b className="display" style={{ fontSize: 19 }}>{fmt(total)}</b>
            </div>
            <Field l="Mode de paiement">
              <select className="inp" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="especes">Espèces</option>
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
            <button className="btn gold" style={{ width: "100%", marginTop: 8, fontSize: 15 }} onClick={payer}>
              Encaisser {total > 0 ? fmt(total) : ""}
            </button>
          </div>
        </div>
      )}

      {tab === "hist" && (
        <div className="card">
          {ventes.length === 0 && <div style={{ padding: 20 }}><Empty t="Aucune vente pour l'instant." /></div>}
          {ventes.length > 0 && (
            <table className="tb">
              <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Documents</th></tr></thead>
              <tbody>
                {ventes.map((v) => (
                  <tr key={v.id}>
                    <td><b>{v.num}</b></td><td>{v.date}</td><td>{v.client}</td>
                    <td>{v.lignes.reduce((s, l) => s + l.qte, 0)}</td>
                    <td><b>{fmt(v.total)}</b></td>
                    <td><span className={"pill " + (v.mode === "especes" ? "ok" : "warn")}>{v.mode === "especes" ? "Espèces" : "Crédit"}</span></td>
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
function Clients({ clients, setClients, ventes, encaisserCredit }) {
  const [sel, setSel] = useState(null);
  const [pay, setPay] = useState("");
  const [nc, setNc] = useState({ nom: "", tel: "" });
  const histo = sel ? ventes.filter((v) => v.client === sel.nom) : [];

  return (
    <div>
      <H1 t="Clients" s="Historique d'achats et suivi des crédits" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div className="card">
          <table className="tb">
            <thead><tr><th>Client</th><th>Téléphone</th><th>Crédit en cours</th><th></th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ background: sel?.id === c.id ? "#FBF7EA" : undefined }}>
                  <td><b>{c.nom}</b></td><td>{c.tel}</td>
                  <td>{c.credit > 0 ? <span className="pill warn">{fmt(c.credit)}</span> : <span className="pill ok">À jour</span>}</td>
                  <td><button className="btn sm ghost" onClick={() => setSel(c)}>Détails</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Nouveau client</h3>
            <Field l="Nom"><input className="inp" value={nc.nom} onChange={(e) => setNc({ ...nc, nom: e.target.value })} /></Field>
            <Field l="Téléphone"><input className="inp" value={nc.tel} onChange={(e) => setNc({ ...nc, tel: e.target.value })} /></Field>
            <button className="btn" onClick={() => { if (!nc.nom) return; setClients((cs) => [...cs, { id: nid(), nom: nc.nom, tel: nc.tel, credit: 0 }]); setNc({ nom: "", tel: "" }); }}>Ajouter</button>
          </div>

          {sel && (
            <div className="card" style={{ padding: 16 }}>
              <h3 className="display" style={{ margin: "0 0 6px", fontSize: 15 }}>{sel.nom}</h3>
              <div style={{ fontSize: 13, color: "#7A8078" }}>{sel.tel}</div>
              <div style={{ margin: "10px 0", fontSize: 14 }}>
                Crédit en cours : <b style={{ color: sel.credit > 0 ? "var(--amber2)" : "var(--green)" }}>{fmt(sel.credit)}</b>
              </div>
              {sel.credit > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="inp" type="number" placeholder="Montant reçu" value={pay} onChange={(e) => setPay(e.target.value)} />
                  <button className="btn gold" onClick={() => { const m = Number(pay); if (m > 0) { encaisserCredit(sel, m); setSel({ ...sel, credit: Math.max(0, sel.credit - m) }); setPay(""); } }}>Encaisser</button>
                </div>
              )}
              <div className="dash" />
              <b style={{ fontSize: 13 }}>Historique des achats</b>
              {histo.length === 0 && <Empty t="Aucun achat enregistré dans cette session." />}
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
function Fours({ fours, setFours, produits, achats, receptionAchat, reglerDette }) {
  const [f, setF] = useState({ fourId: fours[0]?.id, prodId: produits[0]?.id, qte: 10, coutU: "", paye: "" });
  const [nf, setNf] = useState({ nom: "", tel: "" });
  const [reg, setReg] = useState({});

  return (
    <div>
      <H1 t="Fournisseurs" s="Achats, réceptions et suivi des dettes" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <h3 className="display" style={{ margin: "0 0 12px", fontSize: 15 }}>Nouvel achat</h3>
            <Field l="Fournisseur"><select className="inp" value={f.fourId} onChange={(e) => setF({ ...f, fourId: e.target.value })}>
              {fours.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select></Field>
            <Field l="Produit"><select className="inp" value={f.prodId} onChange={(e) => setF({ ...f, prodId: e.target.value })}>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field l="Quantité"><input className="inp" type="number" value={f.qte} onChange={(e) => setF({ ...f, qte: e.target.value })} /></Field>
              <Field l="Coût unitaire (F)"><input className="inp" type="number" value={f.coutU} onChange={(e) => setF({ ...f, coutU: e.target.value })} /></Field>
            </div>
            <Field l={"Montant payé maintenant (total : " + fmt((Number(f.qte) || 0) * (Number(f.coutU) || 0)) + ")"}>
              <input className="inp" type="number" value={f.paye} onChange={(e) => setF({ ...f, paye: e.target.value })} />
            </Field>
            <button className="btn" style={{ width: "100%" }} onClick={() => {
              const qte = Number(f.qte), coutU = Number(f.coutU), paye = Number(f.paye) || 0;
              if (qte > 0 && coutU > 0 && paye <= qte * coutU) { receptionAchat({ ...f, qte, coutU, paye }); setF({ ...f, coutU: "", paye: "" }); }
            }}>Réceptionner l'achat</button>
            <div style={{ fontSize: 11.5, color: "#7A8078", marginTop: 8 }}>Le reste non payé s'ajoute automatiquement à la dette du fournisseur.</div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 className="display" style={{ margin: "0 0 10px", fontSize: 15 }}>Nouveau fournisseur</h3>
            <Field l="Nom"><input className="inp" value={nf.nom} onChange={(e) => setNf({ ...nf, nom: e.target.value })} /></Field>
            <Field l="Téléphone"><input className="inp" value={nf.tel} onChange={(e) => setNf({ ...nf, tel: e.target.value })} /></Field>
            <button className="btn" onClick={() => { if (!nf.nom) return; setFours((fs) => [...fs, { id: nid(), nom: nf.nom, tel: nf.tel, dette: 0 }]); setNf({ nom: "", tel: "" }); }}>Ajouter</button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <table className="tb">
              <thead><tr><th>Fournisseur</th><th>Téléphone</th><th>Dette</th><th>Règlement</th></tr></thead>
              <tbody>
                {fours.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.nom}</b></td><td>{x.tel}</td>
                    <td>{x.dette > 0 ? <span className="pill bad">{fmt(x.dette)}</span> : <span className="pill ok">Soldé</span>}</td>
                    <td>
                      {x.dette > 0 && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input className="inp" type="number" placeholder="Montant" style={{ width: 110, padding: "5px 8px" }}
                            value={reg[x.id] || ""} onChange={(e) => setReg({ ...reg, [x.id]: e.target.value })} />
                          <button className="btn sm" onClick={() => { const m = Number(reg[x.id]); if (m > 0) { reglerDette(x, m); setReg({ ...reg, [x.id]: "" }); } }}>Payer</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div style={{ padding: "12px 14px 0" }}><b style={{ fontSize: 14 }}>Historique des achats</b></div>
            {achats.length === 0 ? <div style={{ padding: 16 }}><Empty t="Aucun achat enregistré dans cette session." /></div> : (
              <table className="tb">
                <thead><tr><th>Date</th><th>Fournisseur</th><th>Produit</th><th>Qté</th><th>Total</th><th>Payé</th><th>Reste</th></tr></thead>
                <tbody>
                  {achats.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td><td>{a.four}</td><td>{a.produit}</td><td>{a.qte}</td>
                      <td>{fmt(a.total)}</td><td>{fmt(a.paye)}</td>
                      <td>{a.reste > 0 ? <b style={{ color: "var(--red)" }}>{fmt(a.reste)}</b> : "—"}</td>
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
function Compta({ journal, caisse, valeurStock, creances, dettes, ventes }) {
  const [tab, setTab] = useState("journal");
  const actif = caisse + valeurStock + creances;
  const capitaux = actif - dettes;

  const statsJour = useMemo(() => {
    const m = {};
    ventes.forEach((v) => { const d = v.date.split(" ")[0]; m[d] = (m[d] || 0) + v.total; });
    return Object.entries(m);
  }, [ventes]);
  const maxCA = Math.max(1, ...statsJour.map(([, v]) => v));

  return (
    <div>
      <H1 t="Comptabilité" s="Journal, bilan et statistiques" />
      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {[["journal", "Journal"], ["bilan", "Bilan"], ["stats", "Statistiques"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "journal" && (
        <div className="card">
          <table className="tb">
            <thead><tr><th>Date</th><th>Libellé</th><th>Type</th><th style={{ textAlign: "right" }}>Entrée (débit)</th><th style={{ textAlign: "right" }}>Sortie (crédit)</th></tr></thead>
            <tbody>
              {[...journal].reverse().map((j) => (
                <tr key={j.id}>
                  <td>{j.date}</td><td>{j.lib}</td><td><span className="pill ok">{j.type}</span></td>
                  <td style={{ textAlign: "right", color: "var(--green)" }}>{j.debit ? "+" + fmt(j.debit) : ""}</td>
                  <td style={{ textAlign: "right", color: "var(--red)" }}>{j.credit ? "−" + fmt(j.credit) : ""}</td>
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
    </div>
  );
}

/* ============ DOCUMENTS ============ */
function Ticket({ v }) {
  return (
    <div className="ticket">
      <div style={{ textAlign: "center" }}>
        <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>MA BOUTIQUE</div>
        <div style={{ fontSize: 11 }}>Abobo, Abidjan · Tél : 07 00 00 00 00</div>
      </div>
      <div className="dash" />
      <div>Ticket : <b>{v.num}</b></div>
      <div>Date : {v.date}</div>
      <div>Client : {v.client}</div>
      <div className="dash" />
      {v.lignes.map((l) => (
        <div key={l.id} style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{l.qte} × {l.nom}</span><span>{fmt(l.qte * l.prix)}</span>
        </div>
      ))}
      <div className="dash" />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
        <b>TOTAL</b><b>{fmt(v.total)}</b>
      </div>
      <div style={{ fontSize: 11, marginTop: 4 }}>Paiement : {v.mode === "especes" ? "Espèces" : "Crédit"}</div>
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
          <div style={{ color: "#7A8078", fontSize: 12 }}>Abobo, Abidjan · 07 00 00 00 00</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 700, color: "var(--amber2)" }}>FACTURE</div>
          <div>N° {v.num.replace("T-", "F-")}</div>
          <div style={{ fontSize: 12 }}>{v.date}</div>
        </div>
      </div>
      <div style={{ margin: "14px 0 10px" }}>Facturé à : <b>{v.client}</b></div>
      <table className="tb" style={{ border: "1px solid var(--line)", borderRadius: 6 }}>
        <thead><tr><th>Désignation</th><th>Qté</th><th style={{ textAlign: "right" }}>P.U.</th><th style={{ textAlign: "right" }}>Montant</th></tr></thead>
        <tbody>
          {v.lignes.map((l) => (
            <tr key={l.id}><td>{l.nom}</td><td>{l.qte}</td><td style={{ textAlign: "right" }}>{fmt(l.prix)}</td><td style={{ textAlign: "right" }}>{fmt(l.qte * l.prix)}</td></tr>
          ))}
          <tr style={{ background: "#FBF7EA" }}>
            <td colSpan={3}><b>Total à payer</b></td>
            <td style={{ textAlign: "right" }}><b className="display" style={{ fontSize: 15 }}>{fmt(v.total)}</b></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 12, fontSize: 12, color: "#7A8078" }}>
        Mode de règlement : {v.mode === "especes" ? "Espèces" : "Crédit"} · Arrêtée la présente facture à la somme de {fmt(v.total)}.
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
