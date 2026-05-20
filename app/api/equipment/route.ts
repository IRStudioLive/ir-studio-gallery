export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export type EquipmentItem = {
  id: string;
  name: string;
  manufacturer?: string;
  category: EquipmentCategory;
  location?: string;
  priceValue?: number;
  imageDataUrl?: string; // base64 data URL
  createdAt: string;
  updatedAt: string;
};

const DATA_PATH = path.join(process.cwd(), "data", "equipment.json");

function readDb(): { items: EquipmentItem[] } {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function writeDb(db: { items: EquipmentItem[] }) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function GET() {
  const db = readDb();
  db.items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return NextResponse.json(db);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const manufacturer = String(body?.manufacturer ?? "").trim();
  const category = String(body?.category ?? "").trim() as EquipmentCategory;
  const location = String(body?.location ?? "").trim();
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : undefined;

  const priceRaw = body?.priceValue;
  const priceValue =
    priceRaw === undefined || priceRaw === null || String(priceRaw).trim() === ""
      ? undefined
      : Number(String(priceRaw).replace(/[^0-9.]/g, ""));

  const allowed: EquipmentCategory[] = [
    "Camera Bodies","Lenses","Batteries","Lighting","Props","Stands",
    "Audio","Backdrops","Grip","Storage","Other",
  ];

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!allowed.includes(category)) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  if (priceValue !== undefined && (Number.isNaN(priceValue) || priceValue < 0)) {
    return NextResponse.json({ error: "Invalid price value." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = crypto.randomBytes(10).toString("hex");

  const item: EquipmentItem = {
    id,
    name,
    manufacturer: manufacturer || undefined,
    category,
    location: location || undefined,
    priceValue,
    imageDataUrl,
    createdAt: now,
    updatedAt: now,
  };

  const db = readDb();
  db.items.unshift(item);
  writeDb(db);

  return NextResponse.json({ ok: true, item });
}
