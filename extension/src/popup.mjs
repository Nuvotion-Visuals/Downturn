import { markdownToHtml } from '../../public/ui.mjs';

const preview = document.getElementById('preview');
const raw = document.getElementById('raw');
const status = document.getElementById('status');
const previewBtn = document.getElementById('previewBtn');
const rawBtn = document.getElementById('rawBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

let currentMarkdown = '';

// Request conversion from background
chrome.runtime.sendMessage({ action: 'convert' }, (response) => {
  if (response?.error) {
    status.textContent = response.error;
    return;
  }
  if (!response?.markdown) {
    status.textContent = 'No content returned';
    return;
  }

  currentMarkdown = response.markdown;
  preview.innerHTML = markdownToHtml(currentMarkdown);
  raw.value = currentMarkdown;
  status.textContent = '';
});

// Sync edits back to currentMarkdown
raw.addEventListener('input', () => {
  currentMarkdown = raw.value;
});

// View toggle
previewBtn.addEventListener('click', () => {
  preview.innerHTML = markdownToHtml(currentMarkdown);
  preview.style.display = 'block';
  raw.style.display = 'none';
  previewBtn.classList.add('active');
  rawBtn.classList.remove('active');
});

rawBtn.addEventListener('click', () => {
  preview.style.display = 'none';
  raw.style.display = 'block';
  rawBtn.classList.add('active');
  previewBtn.classList.remove('active');
});

// Copy
copyBtn.addEventListener('click', async () => {
  if (!currentMarkdown) return;
  await navigator.clipboard.writeText(currentMarkdown);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
});

// Download
downloadBtn.addEventListener('click', () => {
  if (!currentMarkdown) return;
  const match = currentMarkdown.match(/^#\s+(.+)/m);
  let slug = match
    ? match[1].trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    : 'page';
  const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = slug + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
});
