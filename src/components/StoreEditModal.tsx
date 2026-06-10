"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { areaOptions } from "@/data/mockData";
import { X } from "lucide-react";

interface StoreEditModalProps {
  store: {
    id: string;
    name: string;
    ig_username: string;
    area: string;
    vibe_tag?: string;
    parent_salon_ig?: string;
    parent_salon_name?: string;
    branch_name?: string;
    slug?: string;
  };
  onClose: () => void;
  onUpdate: (updatedStore: any) => void;
}

function generateSlug(name: string, branchName?: string): string {
  const rawName = name || '';
  const branchPart = branchName ? '-' + branchName.trim() : '';
  return (rawName + branchPart).toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function StoreEditModal({ store, onClose, onUpdate }: StoreEditModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: store.name,
    ig_username: store.ig_username,
    area: store.area,
    vibe_tag: store.vibe_tag || "",
    parent_salon_ig: store.parent_salon_ig || "",
    parent_salon_name: store.parent_salon_name || "",
    branch_name: store.branch_name || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.ig_username || !form.area) return;
    setSaving(true);
    try {
      // Generate slug from name + branch_name
      const slug = generateSlug(form.name, form.branch_name || undefined);
      
      const updates: any = { 
        ...form, 
        slug,
        branch_name: form.branch_name || null,
      };
      if (!updates.parent_salon_ig) updates.parent_salon_ig = null;
      if (!updates.parent_salon_name) updates.parent_salon_name = null;
      const { error } = await supabase.from("stores").update(updates).eq("id", store.id);
      if (error) throw error;
      onUpdate({ ...store, ...updates });
      onClose();
    } catch (err: any) {
      console.error("Failed to update store:", err);
      alert("更新失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">編輯店家資訊</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">店名</label>
            <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">分店名稱（選填）</label>
            <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.branch_name} onChange={e => setForm({...form, branch_name: e.target.value})} placeholder="例：一中店" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">IG 帳號</label>
            <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.ig_username} onChange={e => setForm({...form, ig_username: e.target.value.replace("@", "")})} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">地區</label>
            <select className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.area} onChange={e => setForm({...form, area: e.target.value})}>
              {areaOptions.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">一句話形容（選填）</label>
            <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.vibe_tag} onChange={e => setForm({...form, vibe_tag: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">母店 IG（選填）</label>
              <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.parent_salon_ig} onChange={e => setForm({...form, parent_salon_ig: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">母店名稱（選填）</label>
              <input className="w-full py-1.5 px-2 text-xs bg-transparent border border-border rounded-lg" value={form.parent_salon_name} onChange={e => setForm({...form, parent_salon_name: e.target.value})} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-medium disabled:opacity-40">{saving ? "儲存中..." : "儲存"}</button>
        </div>
      </div>
    </div>
  );
}
