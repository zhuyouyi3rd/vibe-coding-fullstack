/* Browser-only xlsx/csv/csv reader for the static demo. */
(() => {
  'use strict';

  function decodeXml(text) {
    return String(text)
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function bytesFromDataUrl(dataUrl) {
    const match = String(dataUrl || '').match(/^data:[^;,]*;base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) throw new Error('文件格式不正确');
    const binary = atob(match[1].replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function eocdOffset(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const start = Math.max(0, bytes.length - 65557);
    for (let i = bytes.length - 22; i >= start; i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) return i;
    }
    throw new Error('不是有效的 xlsx 文件');
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('这个浏览器不支持解压 xlsx，请改用 CSV');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function zipFiles(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const eocd = eocdOffset(bytes);
    const count = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const entries = new Map();
    const decoder = new TextDecoder('utf-8');
    for (let i = 0; i < count; i += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      entries.set(name, { method, compressedSize, localOffset });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    const files = new Map();
    for (const [name, entry] of entries) {
      const local = entry.localOffset;
      if (view.getUint32(local, true) !== 0x04034b50) continue;
      const nameLength = view.getUint16(local + 26, true);
      const extraLength = view.getUint16(local + 28, true);
      const start = local + 30 + nameLength + extraLength;
      const compressed = bytes.slice(start, start + entry.compressedSize);
      files.set(name, entry.method === 0 ? compressed : await inflateRaw(compressed));
    }
    return files;
  }

  function textOf(xml) {
    return [...String(xml).matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1])).join('');
  }

  function columnIndex(reference) {
    const letters = String(reference || '').match(/^[A-Z]+/i)?.[0]?.toUpperCase() || 'A';
    let index = 0;
    for (const letter of letters) index = index * 26 + (letter.charCodeAt(0) - 64);
    return index - 1;
  }

  async function parseXlsx(bytes) {
    const decoder = new TextDecoder('utf-8');
    const files = await zipFiles(bytes);
    const sharedXml = files.get('xl/sharedStrings.xml');
    const shared = sharedXml
      ? [...decoder.decode(sharedXml).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
      : [];
    const sheetName = [...files.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]))[0];
    if (!sheetName) throw new Error('xlsx 里没有工作表');
    const xml = decoder.decode(files.get(sheetName));
    const rows = [];
    for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const reference = attrs.match(/\br="([^"]+)"/)?.[1];
        const type = attrs.match(/\bt="([^"]+)"/)?.[1] || '';
        let value = '';
        if (type === 'inlineStr') {
          value = textOf(body.match(/<is>([\s\S]*?)<\/is>/)?.[1] || body);
        } else {
          const raw = decodeXml(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || '');
          if (type === 's') value = shared[Number(raw)] ?? '';
          else if (type === 'b') value = raw === '1';
          else if (raw !== '') value = Number.isFinite(Number(raw)) ? Number(raw) : raw;
        }
        const index = reference ? columnIndex(reference) : row.length;
        while (row.length < index) row.push('');
        row[index] = value;
      }
      rows.push(row);
    }
    return rows;
  }

  function parseCsvLine(line) {
    const cells = [];
    let value = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"') quoted = true;
      else if (char === ',') { cells.push(value); value = ''; }
      else value += char;
    }
    cells.push(value);
    return cells;
  }

  function normalize(rows) {
    const text = (v) => (v == null ? '' : String(v).trim());
    const amount = (v) => {
      if (v == null || v === '') return null;
      const n = Number(String(v).replace(/[¥￥,，\s元]/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    let headerIndex = -1;
    let map = {};
    for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
      const candidate = {};
      rows[i].forEach((cell, index) => {
        const value = text(cell);
        if (/分组|组别/.test(value)) candidate.group = index;
        else if (/序号|编号/.test(value)) candidate.seq = index;
        else if (/姓名|名字/.test(value)) candidate.name = index;
        else if (/金额|礼金|礼钱/.test(value)) candidate.amount = index;
        else if (/地址|住址/.test(value)) candidate.address = index;
        else if (/备注|说明/.test(value)) candidate.note = index;
      });
      if (candidate.name != null) {
        headerIndex = i;
        map = candidate;
        if (map.address == null && map.note != null) {
          map.address = map.note;
          delete map.note;
        }
        break;
      }
    }
    if (headerIndex < 0) {
      map = { group: 0, seq: 1, name: 2, amount: 3, address: 4 };
    }
    const result = [];
    let lastAddress = '';
    let skipped = 0;
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const name = text(row[map.name]);
      if (!name || /^合计|^共\s*\d+\s*人|总计/.test(name)) { skipped += 1; continue; }
      let address = map.address == null ? '' : text(row[map.address]);
      if (!address || /^[.．。·•]$/.test(address)) address = lastAddress;
      else lastAddress = address;
      result.push({
        groupName: map.group == null ? '' : text(row[map.group]),
        name,
        address,
        amount: map.amount == null ? null : amount(row[map.amount]),
        note: map.note == null ? '' : text(row[map.note]),
      });
    }
    return { rows: result.map((row, index) => ({ ...row, seq: index + 1 })), total: result.length, skipped };
  }

  async function parseFile(dataUrl, filename) {
    const lower = String(filename || '').toLowerCase();
    if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
      const bytes = bytesFromDataUrl(dataUrl);
      return normalize(parseCsvBytes(bytes));
    }
    const bytes = bytesFromDataUrl(dataUrl);
    if (lower.endsWith('.xlsx') || (bytes[0] === 0x50 && bytes[1] === 0x4b)) {
      return normalize(await parseXlsx(bytes));
    }
    throw new Error('只支持 .xlsx、.csv 文件');
  }

  function parseCsvBytes(bytes) {
    const text = new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
    return text.split(/\r?\n/).filter((line) => line.trim() !== '').map(parseCsvLine);
  }

  window.GiftbookParse = { parseFile };
})();
