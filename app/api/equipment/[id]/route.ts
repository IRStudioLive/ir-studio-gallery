import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { EquipmentItem } from "../route";

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "equipment.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ items: [] }, null, 2), "utf8");
  }
}

function readDb(): { items: EquipmentItem[] } {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { items: [] };
  }
}

function writeDb(db: { items: EquipmentItem[] }) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const db = readDb();
    const item = db.items.find((x) => x.id === id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Load failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const patch = await req.json();
    const db = readDb();
    const idx = db.items.findIndex((x) => x.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.items[idx] = {
      ...db.items[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };

    writeDb(db);
    return NextResponse.json({ ok: true, item: db.items[idx] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const db = readDb();
    const before = db.items.length;
    db.items = db.items.filter((x) => x.id !== id);

    if (db.items.length === before) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    writeDb(db);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
