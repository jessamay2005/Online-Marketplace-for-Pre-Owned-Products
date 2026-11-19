export const money = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export const monthKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (k) => {
  const [y, m] = k.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
};

export const uid = (prefix) =>
  prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

/** Read an image file, shrink it, and return a small JPEG data URL (keeps localStorage light). */
export function fileToDataUrl(file, max = 700, square = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const side = square ? Math.min(img.width, img.height) : 0; // square = crop the centre
        const sx = square ? (img.width - side) / 2 : 0;
        const sy = square ? (img.height - side) / 2 : 0;
        const sw = square ? side : img.width;
        const sh = square ? side : img.height;
        const scale = Math.min(1, max / Math.max(sw, sh));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // so transparent PNGs do not turn black
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
