'use client';

import { QrCode, Plus, Download, Trash2, Smartphone, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { qrApi } from '@/lib/api';

export default function QrTagsPage() {
  const [tags, setTags] = useState<any[]>([]);

  const fetchTags = async () => {
    try {
      const res = await qrApi.getMyTags();
      setTags(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleGenerate = async () => {
    const itemName = prompt('What item is this tag for? (e.g., Backpack)');
    if (!itemName) return;
    try {
      await qrApi.createTag({ itemName });
      fetchTags();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this tag?')) return;
    try {
      await qrApi.deactivateTag(id);
      fetchTags();
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await qrApi.activateTag(id);
      fetchTags();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = (tagCode: string, itemName: string) => {
    const svg = document.getElementById(`qr-${tagCode}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${itemName.replace(/\s+/g, '_')}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-[family-name:var(--font-display)]">QR Smart Tags</h1>
          <p className="text-white/60 mt-1">Generate QR codes to attach to your valuable items</p>
        </div>
        <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium shadow-glow hover:shadow-xl transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Generate New Tag
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-accent-500/10 border border-accent-500/20 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-accent-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">How it works</h3>
          <p className="text-sm text-white/70 mt-1">Generate a unique QR code, print it, and attach it to your item. If someone finds your item, they can scan the code with their smartphone camera to instantly notify you and securely arrange a return.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div key={tag.id} className={`bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.12] p-6 flex flex-col items-center text-center transition-all ${!tag.isActive ? 'opacity-60 grayscale hover:opacity-80' : 'hover:shadow-lg'}`}>
            <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] border-2 border-white/[0.08] rounded-xl mb-4 shadow-sm" id={`qr-${tag.code}`}>
              <QRCodeSVG value={`https://lnf.example.com/qr/${tag.code}`} size={120} fgColor="#0f172a" />
            </div>
            <h3 className="font-bold text-white text-lg">{tag.itemName}</h3>
            <p className="text-sm text-white/60 mt-1 mb-4">{tag.description}</p>
            <div className="text-xs font-mono bg-white/[0.04] px-3 py-1 rounded-md text-white/70 mb-6">
              {tag.code}
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full mt-auto">
              <button onClick={() => handleDownload(tag.code, tag.itemName)} className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.02] text-white/80 font-medium hover:bg-white/[0.04] transition-colors">
                <Download className="w-4 h-4" /> Download
              </button>
              {tag.isActive ? (
                <button onClick={() => handleDelete(tag.id)} className="flex items-center justify-center gap-2 py-2 rounded-xl text-danger-400 hover:bg-danger-500/10 font-medium transition-colors">
                  <Trash2 className="w-4 h-4" /> Deactivate
                </button>
              ) : (
                <button onClick={() => handleActivate(tag.id)} className="flex items-center justify-center gap-2 py-2 rounded-xl text-emerald-600 hover:bg-emerald-50 font-medium transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
