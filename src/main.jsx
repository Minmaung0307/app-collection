import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Plus,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Sparkles,
  Heart,
  Code2,
  BookOpen,
  Wallet,
  Gamepad2,
  Briefcase,
  Layers,
  Pencil,
  Trash2,
  Download,
  Upload,
  Settings2,
  ChevronRight,
  Check,
  ImagePlus,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Command,
  FolderOpen,
  Globe,
  Star,
} from "lucide-react";
import {
  CATEGORIES,
  STATUSES,
  safeUrl,
  validateRecords,
  PRIVATE,
} from "./model";
import {
  cloud,
  ownerUid,
  localLoad,
  localSave,
  watchAuth,
  login,
  logout,
  watchPublic,
  watchPrivate,
  saveCloud,
  deleteCloud,
  importCloud,
  seed,
} from "./store";
import "./styles.css";
const icons = {
  Learning: BookOpen,
  Productivity: Layers,
  Lifestyle: Heart,
  "Developer tools": Code2,
  Finance: Wallet,
  Business: Briefcase,
  Games: Gamepad2,
};
function Artwork({ app, small = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [app.image]);
  const Icon = icons[app.category] || Layers;
  return (
    <div
      className={`artwork ${small ? "small" : ""}`}
      style={{ "--accent": app.color || "#147d73" }}
    >
      {
        <>
          <span className="art-orbit one" />
          <span className="art-orbit two" />
          <span className="art-grid" />
          <span className="art-icon">
            <Icon size={small ? 22 : 43} strokeWidth={1.4} />
          </span>
          {!small && <span className="art-word">{app.name}</span>}
          {app.image && safeUrl(app.image, true) && !failed && (
            <img
              src={safeUrl(app.image, true)}
              alt={`${app.name} cover`}
              loading="lazy"
              onError={() => setFailed(true)}
            />
          )}
        </>
      }
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={wide ? "modal wide" : "modal"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function App() {
  const [apps, setApps] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [user, setUser] = useState(null),
    [privateData, setPrivateData] = useState({}),
    [admin, setAdmin] = useState(false);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All apps"),
    [status, setStatus] = useState("All statuses"),
    [sort, setSort] = useState("Featured first"),
    [view, setView] = useState("grid"),
    [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("studio-saved") || "[]");
    } catch {
      return [];
    }
  });
  const [detail, setDetail] = useState(null),
    [editor, setEditor] = useState(null),
    [settings, setSettings] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(null),
    [busy, setBusy] = useState(false);
  const importRef = useRef(null);
  const isOwner = !cloud || (!!ownerUid && user?.uid === ownerUid);
  const canEdit = admin && isOwner;
  useEffect(() => {
    if (cloud)
      return watchPublic(
        (data) => {
          setApps(data);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        },
      );
    try {
      setApps(localLoad());
    } catch (e) {
      setError(
        `Saved data could not be loaded: ${e.message} Export or restore a valid backup; existing data has not been overwritten.`,
      );
    }
    setLoading(false);
  }, []);
  useEffect(() => watchAuth(setUser), []);
  useEffect(() => {
    if (cloud && user?.uid === ownerUid)
      return watchPrivate(setPrivateData, (e) => setError(e.message));
    setPrivateData({});
  }, [user]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const records = apps.map((a) => ({
    ...a,
    ...(canEdit ? privateData[a.id] : {}),
  }));
  const selected = detail ? records.find((a) => a.id === detail) : null;
  const filtered = records
    .filter(
      (a) =>
        (category === "All apps" || a.category === category) &&
        (status === "All statuses" || a.status === status) &&
        (!savedOnly || saved.includes(a.id)) &&
        `${a.name} ${a.description} ${a.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Name A–Z"
        ? a.name.localeCompare(b.name)
        : sort === "Newest first"
          ? (b.dateAdded || "").localeCompare(a.dateAdded || "")
          : Number(b.featured) - Number(a.featured) ||
            a.name.localeCompare(b.name),
    );
  function notify(message) {
    setToast(message);
  }
  function favorite(id) {
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    try {
      localStorage.setItem("studio-saved", JSON.stringify(next));
      setSaved(next);
    } catch {
      setError("Your browser could not save this favorite.");
    }
  }
  async function save(record) {
    setBusy(true);
    setError("");
    try {
      const [clean] = validateRecords([record]);
      if (cloud) await saveCloud(clean);
      else {
        const next = apps.some((a) => a.id === clean.id)
          ? apps.map((a) => (a.id === clean.id ? clean : a))
          : [...apps, clean];
        localSave(next);
        setApps(next);
      }
      setEditor(null);
      notify("App saved. Your collection is up to date.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      if (cloud) await deleteCloud(confirmDelete.id);
      else {
        const next = apps.filter((a) => a.id !== confirmDelete.id);
        localSave(next);
        setApps(next);
      }
      if (saved.includes(confirmDelete.id)) favorite(confirmDelete.id);
      setConfirmDelete(null);
      setDetail(null);
      notify("App removed from the collection.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), apps: records },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `mmusa-studio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Backup downloaded. It includes private project details.");
  }
  async function importRecords(data) {
    setBusy(true);
    try {
      const clean = validateRecords(data);
      if (cloud) await importCloud(clean);
      else {
        const map = new Map(apps.map((a) => [a.id, a]));
        clean.forEach((a) => map.set(a.id, a));
        const next = validateRecords([...map.values()]);
        localSave(next);
        setApps(next);
      }
      notify(`${clean.length} apps imported.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function readBackup(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Backup must be smaller than 20 MB.");
      const json = JSON.parse(await file.text());
      const data = validateRecords(Array.isArray(json) ? json : json.apps);
      if (
        window.confirm(
          `Import ${data.length} apps? Matching IDs will be updated; other apps will be kept.`,
        )
      )
        await importRecords(data);
    } catch (err) {
      setError(err.message);
    }
  }
  async function enterAdmin() {
    if (cloud && !isOwner) {
      try {
        await login();
        setAdmin(true);
      } catch (e) {
        setError(e.message);
      }
    } else setAdmin(!admin);
  }
  const newApp = () =>
    setEditor({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      category: "Productivity",
      status: "Planned",
      pricing: "Not set",
      image: "",
      url: "",
      color: "#147d73",
      featured: false,
      dateAdded: new Date().toISOString().slice(0, 10),
      ...Object.fromEntries(PRIVATE.map((k) => [k, ""])),
    });
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="MMUSA App Studio home">
          <span className="brand-mark">
            <Command size={24} />
          </span>
          <span>
            MMUSA<span className="brand-sub">APP STUDIO</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={!admin && !savedOnly ? "nav-active" : ""}
            onClick={() => {
              setAdmin(false);
              setSavedOnly(false);
            }}
          >
            Discover
          </button>
          <button
            className={savedOnly ? "nav-active" : ""}
            onClick={() => {
              setSavedOnly(!savedOnly);
              setAdmin(false);
            }}
          >
            Saved <span>{saved.length}</span>
          </button>
        </nav>
        <button
          className={`admin-button ${admin ? "selected" : ""}`}
          onClick={enterAdmin}
          aria-label={admin ? "Exit admin" : "Manage apps"}
        >
          <Settings2 size={16} />
          <span>{admin ? "Exit admin" : "Manage apps"}</span>
        </button>
      </header>
      <main>
        <section className={`hero ${admin ? "admin-hero" : ""}`}>
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot" />
              {admin
                ? "YOUR CREATIVE WORKSPACE"
                : "INDEPENDENT IDEAS. EVERYDAY POSSIBILITIES."}
            </div>
            <h1>
              {admin ? (
                <>
                  A home for
                  <br />
                  everything you <em>build.</em>
                </>
              ) : (
                <>
                  Small apps.
                  <br />
                  <em>Big possibilities.</em>
                </>
              )}
            </h1>
            <p>
              {admin
                ? "Keep your projects organized, share what’s ready, and make room for your next great idea."
                : "Thoughtfully built tools for learning, creating, and everyday life. Explore the growing MMUSA collection."}
            </p>
            <div className="hero-actions">
              {canEdit ? (
                <button className="primary" onClick={newApp}>
                  <Plus size={18} />
                  Add a new app
                </button>
              ) : (
                <a className="primary" href="#collection">
                  Explore the collection <ArrowRight size={17} />
                </a>
              )}
              <span className="hero-caption">
                Built with purpose. Made for you.
              </span>
            </div>
            <div className="hero-stats">
              <span>
                <b>{apps.length.toString().padStart(2, "0")}</b> apps & counting
              </span>
              <i />
              <span>
                <b>{new Set(apps.map((a) => a.category)).size}</b> categories to
                explore
              </span>
              <i />
              <span className="independent">
                <span className="mini-spark">✳</span> Independently crafted
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-ring r1" />
            <div className="visual-ring r2" />
            <div className="visual-caption">
              THE MMUSA COLLECTION <span>↗</span>
            </div>
            <div className="floating-tile tile-one">
              <BookOpen />
              <span>Learn something new.</span>
            </div>
            <div className="floating-tile tile-two">
              <Code2 />
              <span>Build your next idea.</span>
            </div>
            <div className="floating-tile tile-three">
              <Heart />
              <span>Make life a little better.</span>
            </div>
            <span className="spark s1">✳</span>
            <span className="spark s2">✧</span>
            <div className="visual-footer">
              <span>Ideas → useful things</span>
              <span>EST. 2026</span>
            </div>
          </div>
        </section>
        {admin && (
          <div className="admin-strip">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>{cloud ? "Cloud workspace" : "Local workspace"}</strong>
                <small>
                  {cloud
                    ? isOwner
                      ? "Signed in as the collection owner."
                      : "This account is not the configured owner."
                    : "Changes stay in this browser. Export backups to keep a copy."}
                </small>
              </span>
            </div>
            <div className="admin-tools">
              {canEdit && (
                <>
                  <button onClick={exportBackup}>
                    <Download size={16} />
                    Export
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => importRef.current.click()}
                  >
                    <Upload size={16} />
                    Import
                  </button>
                </>
              )}
              <button onClick={() => setSettings(true)}>
                <Settings2 size={16} />
                Setup
              </button>
              {cloud && user && (
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      setAdmin(false);
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={17} />
            </button>
          </div>
        )}
        <section id="collection" className="collection">
          <div className="section-top">
            <div className="section-title">
              <div className="eyebrow">
                {savedOnly
                  ? "YOUR PERSONAL SHORTLIST"
                  : "EXPLORE THE ECOSYSTEM"}
              </div>
              <h2>
                {savedOnly
                  ? "Saved for later"
                  : admin
                    ? "Your app collection"
                    : "Find your next favorite."}
                <span>
                  {savedOnly
                    ? records.filter((a) => saved.includes(a.id)).length
                    : apps.length}
                </span>
              </h2>
            </div>
            <div className="search">
              <Search size={18} />
              <input
                aria-label="Search apps"
                placeholder="Search apps, ideas, possibilities…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="collection-controls">
            <div className="categories" aria-label="Filter by category">
              {["All apps", ...CATEGORIES].map((c) => (
                <button
                  className={category === c ? "active" : ""}
                  key={c}
                  onClick={() => setCategory(c)}
                >
                  {c === "All apps" && <LayoutGrid size={15} />} {c}
                </button>
              ))}
            </div>
            <div className="filter-row">
              <span className="result-count">
                {filtered.length} {filtered.length === 1 ? "app" : "apps"} to{" "}
                {savedOnly ? "revisit" : "discover"}
              </span>
              <div className="filter-tools">
                <label>
                  <SlidersHorizontal size={15} />
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {["All statuses", ...STATUSES].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <select
                  aria-label="Sort apps"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {["Featured first", "Newest first", "Name A–Z"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div className="view-switch">
                  <button
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid size={17} />
                  </button>
                  <button
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="empty">Loading your collection…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <FolderOpen size={42} />
              <h3>
                {apps.length === 0
                  ? "Your next chapter starts here."
                  : "No apps found."}
              </h3>
              <p>
                {apps.length === 0
                  ? "Open Manage apps to add your first app or import the original collection."
                  : "Try another search or explore a different category."}
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("All apps");
                  setStatus("All statuses");
                  setSavedOnly(false);
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className={`app-grid ${view === "list" ? "list-view" : ""}`}>
              {filtered.map((app) => (
                <article className="app-card" key={app.id}>
                  <div className="card-art">
                    <button
                      className="art-open"
                      onClick={() => setDetail(app.id)}
                      aria-label={`View ${app.name}`}
                    >
                      <Artwork app={app} />
                    </button>
                    {app.featured && (
                      <span className="featured">
                        <Sparkles size={12} />
                        Featured
                      </span>
                    )}
                    <button
                      className={`save-button ${saved.includes(app.id) ? "saved" : ""}`}
                      aria-label={`${saved.includes(app.id) ? "Unsave" : "Save"} ${app.name}`}
                      aria-pressed={saved.includes(app.id)}
                      onClick={() => favorite(app.id)}
                    >
                      <Heart
                        size={16}
                        fill={saved.includes(app.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      <span>{app.category}</span>
                      <span className="pricing">{app.pricing}</span>
                    </div>
                    <button
                      className="card-title"
                      onClick={() => setDetail(app.id)}
                    >
                      {app.name}
                      <ArrowUpRight size={19} />
                    </button>
                    <p className="card-description">
                      {app.description ||
                        "Something wonderful is taking shape. More details coming soon."}
                    </p>
                    <div className="card-footer">
                      <span
                        className={`status status-${app.status?.toLowerCase().replace(" ", "-")}`}
                      >
                        <i />
                        {app.status}
                      </span>
                      {canEdit ? (
                        <button
                          className="text-button"
                          onClick={() => setEditor(app)}
                        >
                          <Pencil size={14} />
                          Edit app
                        </button>
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => setDetail(app.id)}
                        >
                          Take a look
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {canEdit && (
            <button className="add-card" onClick={newApp}>
              <span>
                <Plus size={21} />
              </span>
              <b>Your next idea belongs here.</b>
              <small>Add a new app to your collection</small>
              <ArrowRight size={20} />
            </button>
          )}
        </section>
        <section className="bottom-note">
          <span className="note-icon">
            <Sparkles size={24} />
          </span>
          <div>
            <h3>Always creating. Always growing.</h3>
            <p>A collection of ideas brought to life, one app at a time.</p>
          </div>
          <span className="note-sign">
            Made with intention. <Heart size={15} />
          </span>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="/">
          MMUSA <span>APP STUDIO</span>
        </a>
        <p>A little more useful. A little more delightful.</p>
        <span>© {new Date().getFullYear()} MMUSA</span>
      </footer>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={readBackup}
      />
      {selected && (
        <Modal title={selected.name} onClose={() => setDetail(null)}>
          <div className="detail-art">
            <Artwork app={selected} />
          </div>
          <div className="detail-content">
            <div className="detail-tags">
              <span className="pill">{selected.category}</span>
              <span className="pill">{selected.pricing}</span>
              <span className="pill">{selected.status}</span>
            </div>
            <p className="full-description">
              {selected.description || "Details coming soon."}
            </p>
            {selected.name === "Daily Scheduler" && (
              <p className="help">
                Daily Scheduler is a feature inside Re-Member.
              </p>
            )}
            <div className="detail-actions">
              {safeUrl(selected.url) ? (
                <a
                  className="primary"
                  href={safeUrl(selected.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open app
                  <ArrowUpRight size={17} />
                </a>
              ) : (
                <span className="help">App link coming soon</span>
              )}
              <button
                className="secondary"
                onClick={() => favorite(selected.id)}
              >
                <Heart size={16} />
                {saved.includes(selected.id) ? "Saved" : "Save for later"}
              </button>
              {canEdit && (
                <button
                  className="secondary"
                  onClick={() => {
                    setDetail(null);
                    setEditor(selected);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
              )}
            </div>
            {canEdit && (
              <div className="private-details">
                <h3>
                  <ShieldCheck size={17} />
                  Project details <small>Admin only in cloud mode</small>
                </h3>
                <dl>
                  {PRIVATE.map((k) => (
                    <React.Fragment key={k}>
                      <dt>
                        {
                          {
                            repo: "Repository",
                            firebase: "Firebase project",
                            account: "Account",
                            email: "Email",
                            roles: "Roles",
                            users: "Users",
                            notes: "Notes",
                          }[k]
                        }
                      </dt>
                      <dd>{selected[k] || "Not added yet"}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </Modal>
      )}
      {editor && (
        <Editor
          record={editor}
          onClose={() => !busy && setEditor(null)}
          onSave={save}
          busy={busy}
          error={error}
          onDelete={
            apps.some((a) => a.id === editor.id)
              ? () => {
                  setEditor(null);
                  setConfirmDelete(editor);
                }
              : null
          }
        />
      )}
      {confirmDelete && (
        <Modal
          title="Remove this app?"
          onClose={() => !busy && setConfirmDelete(null)}
        >
          <div className="dialog-body">
            <p>
              <strong>{confirmDelete.name}</strong> will be removed from this
              registry. The original app and its service accounts are
              unaffected.
            </p>
            <div className="dialog-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setConfirmDelete(null)}
              >
                Keep app
              </button>
              <button className="danger" disabled={busy} onClick={remove}>
                {busy ? "Removing…" : "Remove app"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {settings && (
        <Modal title="Your workspace" onClose={() => setSettings(false)}>
          <div className="dialog-body">
            <span className="pill">
              {cloud ? "Firebase connected" : "Local mode · ready to use"}
            </span>
            <h3>One collection. Its own home.</h3>
            <p>
              Re-Member stays an independent app. This studio manages the
              collection and links to each project.
            </p>
            <h3>{cloud ? "Cloud owner access" : "Keep your work safe"}</h3>
            <p>
              {cloud
                ? "Only the configured owner can edit apps or read private project information. Public visitors can browse app descriptions and launch links."
                : "Apps are saved in this browser on this device. Local mode has no password protection. Export a backup regularly. To share across devices with secure admin access, follow the Firebase setup in README.md."}
            </p>
            {cloud && user && !isOwner && (
              <p className="help">
                Your UID: <code>{user.uid}</code>. Configure the owner UID and
                deploy matching rules to enable editing.
              </p>
            )}
            {canEdit && (
              <>
                <h3>Original collection</h3>
                <p>
                  Import the 16 records from the uploaded project. Matching
                  original IDs will be updated. Export a backup first if you
                  have edited those apps.
                </p>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Import the original 16 records? Existing records with matching IDs will be updated.",
                      )
                    )
                      importRecords(seed);
                  }}
                >
                  <Upload size={16} />
                  Import original apps
                </button>
              </>
            )}
            <p className="help">
              Existing statuses start as “Unreviewed” because the uploaded
              project did not record lifecycle status.
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
function Editor({ record, onSave, onClose, busy, error, onDelete }) {
  const [form, setForm] = useState({ ...record }),
    [tab, setTab] = useState("App details"),
    [imageError, setImageError] = useState(""),
    [imageBusy, setImageBusy] = useState(false);
  const input = useRef(null);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  async function upload(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImageError("");
    setImageBusy(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Please choose a JPG, PNG or WebP image.");
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose an image under 10 MB.");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas"),
        ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const data = canvas.toDataURL("image/webp", 0.78);
      if (data.length > 700000)
        throw new Error("This image is too detailed. Try a smaller image.");
      update("image", data);
    } catch (err) {
      setImageError(err.message);
    } finally {
      setImageBusy(false);
    }
  }
  function field(k, label, opts = {}) {
    return (
      <label className={`field ${opts.full ? "full" : ""}`} key={k}>
        <span>
          {label}
          {opts.required && " *"}
        </span>
        {opts.area ? (
          <textarea
            rows={k === "description" ? 4 : 3}
            value={form[k] || ""}
            onChange={(e) => update(k, e.target.value)}
            maxLength={10000}
            placeholder={opts.placeholder}
          />
        ) : (
          <input
            type={opts.type || "text"}
            required={opts.required}
            maxLength={k === "name" ? 100 : 10000}
            value={form[k] || ""}
            onChange={(e) => update(k, e.target.value)}
            placeholder={opts.placeholder}
          />
        )}
      </label>
    );
  }
  return (
    <Modal
      title={
        record.name
          ? `Edit ${record.name}`
          : "Bring a new idea to the collection"
      }
      onClose={onClose}
      wide
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div className="editor-tabs">
          {["App details", "Artwork", "Project management"].map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="editor-content">
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <div hidden={tab !== "App details"}>
            <p className="editor-intro">
              The essentials people see when exploring your app.
            </p>
            <div className="form-grid">
              {field("name", "App name", {
                required: true,
                full: true,
                placeholder: "Give your idea a name",
              })}
              {field("description", "Description", {
                area: true,
                full: true,
                placeholder: "What does your app help people do?",
              })}
              {field("url", "App URL", {
                type: "url",
                full: true,
                placeholder: "https://your-app.com",
              })}
              {["category", "status", "pricing"].map((k) => (
                <label className="field" key={k}>
                  <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  <select
                    value={form[k]}
                    onChange={(e) => update(k, e.target.value)}
                  >
                    {(k === "category"
                      ? CATEGORIES
                      : k === "status"
                        ? STATUSES
                        : ["Free", "Paid", "Freemium", "Not set"]
                    ).map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              ))}
              {field("dateAdded", "Date added", { type: "date" })}
              <label className="checkbox full">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                />
                <span>
                  <strong>Feature this app</strong>
                  <small>
                    Give it a little extra spotlight in the collection.
                  </small>
                </span>
              </label>
            </div>
          </div>
          <div hidden={tab !== "Artwork"}>
            <p className="editor-intro">
              No image? No problem. Your app gets its own beautifully generated
              cover.
            </p>
            <div className="art-editor">
              <Artwork app={form} />
              <div>
                <button
                  className="secondary"
                  type="button"
                  disabled={imageBusy}
                  onClick={() => input.current.click()}
                >
                  <ImagePlus size={17} />
                  {imageBusy ? "Preparing…" : "Upload image"}
                </button>
                <p className="help">
                  JPG, PNG or WebP · up to 10 MB
                  <br />
                  Automatically resized for your collection.
                </p>
                {form.image && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => update("image", "")}
                  >
                    Use generated artwork
                  </button>
                )}
              </div>
            </div>
            {imageError && (
              <p className="inline-error" role="alert">
                {imageError}
              </p>
            )}
            {field("image", "Or paste an image URL", {
              placeholder: "https://…",
              full: true,
            })}
            <label className="color-field">
              Artwork accent
              <input
                type="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
              <span>{form.color}</span>
            </label>
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={upload}
            />
          </div>
          <div hidden={tab !== "Project management"}>
            <div className="privacy-note">
              <ShieldCheck size={20} />
              <span>
                Project details are hidden from the public cloud collection.
                Local mode is a personal workspace; do not store passwords or
                secret keys.
              </span>
            </div>
            <div className="form-grid">
              {field("repo", "Repository / GitHub URL", {
                type: "url",
                full: true,
                placeholder: "https://github.com/you/project",
              })}
              {field("firebase", "Firebase project ID", {
                placeholder: "my-project-id",
              })}
              {field("account", "Owner / service account label", {
                placeholder: "Personal, team, or organization",
              })}
              {field("email", "Contact / account email", {
                type: "email",
                full: true,
                placeholder: "owner@example.com",
              })}
              {field("roles", "Roles & access", {
                area: true,
                placeholder: "Owner, admin, editor, member…",
              })}
              {field("users", "Users / audience", {
                area: true,
                placeholder: "Who uses this app? Team or user count…",
              })}
              {field("notes", "Project notes", {
                area: true,
                full: true,
                placeholder: "Roadmap, deployment notes, next steps…",
              })}
            </div>
          </div>
        </div>
        <div className="editor-footer">
          {onDelete && (
            <button
              type="button"
              className="delete-button"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 size={16} />
              <span>Remove</span>
            </button>
          )}
          <div>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={busy || imageBusy}
              onClick={() => {
                if (!form.name.trim()) setTab("App details");
              }}
            >
              <Check size={17} />
              {busy ? "Saving…" : "Save app"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
