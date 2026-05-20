"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type EquipmentCategory =
  | "Camera Bodies"
  | "Lenses"
  | "Batteries"
  | "Lighting"
  | "Props"
  | "Stands"
  | "Audio"
  | "Backdrops"
  | "Grip"
  | "Storage"
  | "Other";

type EquipmentItem = {
  id: string;
  name: string;
  manufacturer?: string;
  category: EquipmentCategory;
  location?: string;
  priceValue?: number;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const CATEGORIES: EquipmentCategory[] = [
  "Camera Bodies","Lenses","Batteries","Lighting","Props","Stands",
  "Audio","Backdrops","Grip","Storage","Other",
];

function money(v?: number) {
  if (v === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

function Icon({ name }: { name: string }) {
  const common = "w-4 h-4 opacity-90";
  switch (name) {
    case "plus":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "search":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "photo":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h3l2-2h6l2 2h3v12H4V7z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "trash":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M6 6l1 16h10l1-16" />
        </svg>
      );
    case "edit":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function EquipmentLibraryPage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<EquipmentCategory | "All">("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<EquipmentItem | null>(null);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    category: "Camera Bodies" as EquipmentCategory,
    location: "",
    priceValue: "",
    imageDataUrl: undefined as string | undefined,
  });

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/equipment", { cache: "no-store" });
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch (error: unknown) {
      setErr(errorMessage(error, "Failed to load."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      const inCat = activeCat === "All" ? true : it.category === activeCat;
      const hay = `${it.name} ${it.manufacturer || ""} ${it.category} ${it.location || ""} ${it.priceValue ?? ""}`.toLowerCase();
      const inQ = !qq ? true : hay.includes(qq);
      return inCat && inQ;
    });
  }, [items, q, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<EquipmentCategory, EquipmentItem[]>();
    for (const c of CATEGORIES) map.set(c, []);
    for (const it of filtered) map.get(it.category)?.push(it);
    return map;
  }, [filtered]);

  function openCreate() {
    setEditItem(null);
    setForm({
      name: "",
      manufacturer: "",
      category: activeCat !== "All" ? (activeCat as EquipmentCategory) : "Camera Bodies",
      location: "",
      priceValue: "",
      imageDataUrl: undefined,
    });
    setModalOpen(true);
  }

  function openEdit(it: EquipmentItem) {
    setEditItem(it);
    setForm({
      name: it.name || "",
      manufacturer: it.manufacturer || "",
      category: it.category,
      location: it.location || "",
      priceValue: it.priceValue === undefined ? "" : String(it.priceValue),
      imageDataUrl: it.imageDataUrl,
    });
    setModalOpen(true);
  }

  async function save() {
    setErr(null);
    const payload = {
      name: form.name,
      manufacturer: form.manufacturer,
      category: form.category,
      location: form.location,
      priceValue: form.priceValue,
      imageDataUrl: form.imageDataUrl,
    };

    try {
      const r = await fetch(editItem ? `/api/equipment/${editItem.id}` : "/api/equipment", {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save failed.");
      setModalOpen(false);
      setEditItem(null);
      await refresh();
    } catch (error: unknown) {
      setErr(errorMessage(error, "Save failed."));
    }
  }

  async function remove(it: EquipmentItem) {
    if (!confirm(`Delete "${it.name}"?`)) return;
    setErr(null);
    try {
      const r = await fetch(`/api/equipment/${it.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Delete failed.");
      await refresh();
    } catch (error: unknown) {
      setErr(errorMessage(error, "Delete failed."));
    }
  }

  async function onPickFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, imageDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen w-full bg-[#070708] text-zinc-100">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#070708]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs tracking-[0.35em] text-zinc-400">EQUIPMENT TRACKER</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">Gear Library</div>
              <div className="mt-1 text-sm text-zinc-400">
                Add cameras, lenses, lights, props, stands, and keep everything organized by category.
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Icon name="search" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, manufacturer, location…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500 sm:w-[260px]"
                />
              </div>

              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold shadow-[0_10px_40px_rgba(0,0,0,0.55)] transition hover:bg-white/15"
              >
                <Icon name="plus" />
                Add Equipment
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCat("All")}
              className={[
                "rounded-full border px-4 py-2 text-xs font-semibold transition",
                activeCat === "All" ? "border-white/20 bg-white/15 text-white" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
              ].join(" ")}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={[
                  "rounded-full border px-4 py-2 text-xs font-semibold transition",
                  activeCat === c ? "border-white/20 bg-white/15 text-white" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>

          {err ? <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">{err}</div> : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-zinc-300">Loading library…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
            <div className="text-lg font-semibold">No gear found</div>
            <div className="mt-2 text-sm text-zinc-400">Add your first item, or adjust your search/category filter.</div>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
            >
              <Icon name="plus" />
              Add Equipment
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([cat, list]) => {
              if (activeCat !== "All" && activeCat !== cat) return null;
              if (!list.length) return null;

              return (
                <section key={cat} className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm font-semibold">{cat}</div>
                      <div className="text-xs text-zinc-500">{list.length} item{list.length === 1 ? "" : "s"}</div>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 mx-4 mb-2" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {list.map((it) => (
                      <div key={it.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold">{it.name}</div>
                            <div className="mt-1 text-sm text-zinc-400">
                              {it.manufacturer ? it.manufacturer : "—"} •{" "}
                              <span className="text-zinc-500">{it.location ? it.location : "No location"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(it)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                              title="Edit"
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              onClick={() => remove(it)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                              title="Delete"
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <div className="text-[10px] tracking-[0.25em] text-zinc-500">VALUE</div>
                            <div className="mt-1 text-sm font-semibold">{money(it.priceValue)}</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <div className="text-[10px] tracking-[0.25em] text-zinc-500">UPDATED</div>
                            <div className="mt-1 text-sm font-semibold">{new Date(it.updatedAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => setViewItem(it)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold transition hover:bg-white/15"
                          >
                            <Icon name="photo" />
                            View Picture
                          </button>
                          <div className="text-xs text-zinc-500 self-center">{it.imageDataUrl ? "Photo saved" : "No photo"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0d]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <div className="text-xs tracking-[0.35em] text-zinc-500">{editItem ? "EDIT EQUIPMENT" : "ADD EQUIPMENT"}</div>
                <div className="mt-2 text-xl font-semibold">{editItem ? editItem.name : "New item"}</div>
              </div>
              <button onClick={() => { setModalOpen(false); setEditItem(null); }} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                Close
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Name (required)" value={form.name} onChange={(e)=>setForm(p=>({...p,name:e.target.value}))} />

                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Manufacturer" value={form.manufacturer} onChange={(e)=>setForm(p=>({...p,manufacturer:e.target.value}))} />

                <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  value={form.category} onChange={(e)=>setForm(p=>({...p,category:e.target.value as EquipmentCategory}))}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0b0b0d]">{c}</option>)}
                </select>

                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Location (Studio A / Shelf 2 / etc.)" value={form.location} onChange={(e)=>setForm(p=>({...p,location:e.target.value}))} />

                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Price Value (USD)" value={form.priceValue} onChange={(e)=>setForm(p=>({...p,priceValue:e.target.value}))} />

                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e)=>{ const f=e.target.files?.[0]; if(f) onPickFile(f); if(fileRef.current) fileRef.current.value=""; }} />
                  <button onClick={()=>fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15">
                    <Icon name="photo" /> Take / Upload
                  </button>
                  <span className="text-xs text-zinc-500">{form.imageDataUrl ? "Attached" : "No photo"}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={()=>{ setModalOpen(false); setEditItem(null); }} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10">
                  Cancel
                </button>
                <button onClick={save} className="rounded-2xl border border-white/10 bg-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/20">
                  {editItem ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#0b0b0d]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div className="min-w-0">
                <div className="text-xs tracking-[0.35em] text-zinc-500">EQUIPMENT PHOTO</div>
                <div className="mt-2 truncate text-xl font-semibold">{viewItem.name}</div>
              </div>
              <button onClick={()=>setViewItem(null)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                Close
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                {viewItem.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewItem.imageDataUrl} alt={viewItem.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-zinc-500">No photo saved.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
