export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  if (!dataUrl.startsWith('data:image/png')) {
    throw new Error('The generated file is not a PNG image');
  }

  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Failed to prepare image download');

  const blob = await response.blob();
  if (!blob.size || blob.type !== 'image/png') {
    throw new Error('The generated PNG image is empty or invalid');
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function safeDownloadName(value: string, fallback: string): string {
  const safeName = value
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return safeName || fallback;
}
