import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import JSZip from 'jszip';
import type { PerjadinReportItem } from './perjadinTypes';

/**
 * Optimizes an image (Blob / File / HTMLCanvasElement) for embedding into Word.
 * Constrains max width to 1200px and exports as high quality JPEG (~85%),
 * keeping file size lightweight (150-300KB) while razor sharp in print.
 */
export async function optimizeImageForDocx(
  source: Blob | File | HTMLCanvasElement,
  maxWidth = 1200,
  quality = 0.85
): Promise<{ data: Uint8Array; width: number; height: number }> {
  let canvas: HTMLCanvasElement;
  let origW: number;
  let origH: number;

  if (source instanceof HTMLCanvasElement) {
    origW = source.width;
    origH = source.height;
    const scale = Math.min(1, maxWidth / origW);
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));

    if (scale < 1) {
      canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0, targetW, targetH);
      }
    } else {
      canvas = source;
    }
  } else {
    const bitmap = await createImageBitmap(source);
    origW = bitmap.width;
    origH = bitmap.height;
    const scale = Math.min(1, maxWidth / origW);
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));

    canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    }
    bitmap.close();
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  );

  if (!blob) {
    throw new Error('Gagal mengonversi gambar untuk dokumen Word');
  }

  const arrayBuffer = await blob.arrayBuffer();
  return {
    data: new Uint8Array(arrayBuffer),
    width: origW,
    height: origH,
  };
}

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const SINGLE_BLACK_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4, // 0.5 pt
  color: '000000',
};

const BOX_BORDERS = {
  top: SINGLE_BLACK_BORDER,
  bottom: SINGLE_BLACK_BORDER,
  left: SINGLE_BLACK_BORDER,
  right: SINGLE_BLACK_BORDER,
  insideHorizontal: SINGLE_BLACK_BORDER,
  insideVertical: SINGLE_BLACK_BORDER,
};

/**
 * Builds a single-page section structure for one Perjadin report.
 */
export function buildPerjadinSection(
  item: PerjadinReportItem,
  imgResult?: { data: Uint8Array; width: number; height: number } | null
) {
  // Opening sentence with Surat Tugas fallback rule (AGENTS.md Rule 4.3)
  const hasST = Boolean(item.nomorST && item.nomorST.trim());
  let openingText: string;
  if (hasST) {
    const noSt = item.nomorST!.trim();
    const tglSt = item.tanggalST && item.tanggalST.trim() ? ` tanggal ${item.tanggalST.trim()}` : '';
    openingText = `Berdasarkan surat tugas nomor ${noSt}${tglSt} bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`;
  } else {
    openingText = `Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`;
  }

  // Header Table (Perihal on left, Tanggal on right) - NO BORDER per user specification
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 40, bottom: 40, left: 0, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Perihal  :  Laporan Perjalanan Dinas ${item.namaKegiatan}`,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            margins: { top: 40, bottom: 40, left: 120, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: item.tanggalSurat,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Items 1-6 Info Table
  const makeInfoRow = (no: string, label: string, val: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 360, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(no)] })],
        }),
        new TableCell({
          width: { size: 2800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(label)] })],
        }),
        new TableCell({
          width: { size: 250, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(':')] })],
        }),
        new TableCell({
          width: { size: 7362, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(val)] })],
        }),
      ],
    });

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      makeInfoRow('1.', 'Nama', item.nama),
      makeInfoRow('2.', 'Jabatan', item.jabatan),
      makeInfoRow('3.', 'Asal Satker', item.asalSatker),
      makeInfoRow('4.', 'Tujuan perjalanan', item.tujuan),
      makeInfoRow('5.', 'Hari, Tanggal', item.hariTanggal),
      makeInfoRow('6.', 'Uraian kegiatan perjalanan dinas', ''),
    ],
  });

  // Dokumentasi Table Header (Item 7)
  const dokTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [makeInfoRow('7.', 'Dokumentasi', '')],
  });

  // Signature Block Table
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun('Pelaksana perjalanan dinas')],
              }),
            ],
          }),
        ],
      }),
      // 3 Blank rows for physical signature
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: '' })] }),
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 360, after: 360 },
                text: '',
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: '' })] }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: item.nama,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Image block: Rata tengah & rasio tetap terjaga (anti-penyok)
  let imageParagraph: Paragraph;
  if (imgResult && imgResult.data) {
    const targetHeight = item.photoTargetHeight || 185;
    const aspect = imgResult.width / Math.max(1, imgResult.height);
    let docxHeight = targetHeight;
    let docxWidth = Math.round(docxHeight * aspect);

    // Batas lebar maksimal halaman Word agar tidak melebihi margin (max 460 pt / ~12 cm)
    const maxWordWidth = 460;
    if (docxWidth > maxWordWidth) {
      docxWidth = maxWordWidth;
      docxHeight = Math.round(docxWidth / aspect);
    }

    imageParagraph = new Paragraph({
      alignment: AlignmentType.CENTER, // Rata tengah
      spacing: { before: 80, after: 140 },
      children: [
        new ImageRun({
          type: 'jpg',
          data: imgResult.data,
          transformation: {
            width: docxWidth,
            height: docxHeight,
          },
        }),
      ],
    });
  } else {
    imageParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [new TextRun({ text: '[Foto dokumentasi terlampir]', italics: true })],
    });
  }

  return {
    properties: {
      page: {
        // Standard A4: 210mm x 297mm (11906 twips x 16838 twips)
        size: { width: 11906, height: 16838 },
        // Standard Narrow Margin 1 cm (567 twips)
        margin: { top: 567, right: 567, bottom: 567, left: 567 },
      },
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: 'LAPORAN PERJALANAN DINAS',
            bold: true,
            size: 24, // 12pt
          }),
        ],
      }),

      // Header Table (Perihal & Tanggal)
      headerTable,

      // Recipient
      new Paragraph({
        spacing: { before: 140, after: 0 },
        children: [new TextRun('Kepada Yang Terhormat:')],
      }),
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 0, after: 0 },
        children: [new TextRun('Kepala BPS Kabupaten Lombok Tengah')],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun('di')],
      }),
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 0, after: 140 },
        children: [new TextRun('Tempat')],
      }),

      // Opening Sentence
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 120 },
        children: [new TextRun(openingText)],
      }),

      // Info Table (1-6)
      infoTable,

      // Uraian Kegiatan Content (Indented, Justified)
      new Paragraph({
        indent: { left: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 40, after: 120 },
        children: [new TextRun(item.uraian)],
      }),

      // Item 7 Header
      dokTable,

      // Stamped Photo Image
      imageParagraph,

      // Signature Block
      signatureTable,
    ],
  };
}

/**
 * Creates a single `.docx` file for 1 Perjadin report.
 */
export async function generateSinglePerjadinDocx(
  item: PerjadinReportItem,
  sourceImage?: Blob | File | HTMLCanvasElement | null
): Promise<Blob> {
  let imgResult: { data: Uint8Array; width: number; height: number } | null = null;
  if (sourceImage) {
    imgResult = await optimizeImageForDocx(sourceImage);
  }

  const section = buildPerjadinSection(item, imgResult);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12 pt
          },
          paragraph: {
            spacing: { line: 276, lineRule: LineRuleType.AUTO }, // ~1.15 line spacing
          },
        },
      },
    },
    sections: [section],
  });

  return await Packer.toBlob(doc);
}

/**
 * Creates a combined multi-page `.docx` file containing all Perjadin reports.
 * Each report is placed in its own page section, exactly matching official BPS compilation reports.
 */
export async function generateBulkCombinedPerjadinDocx(
  items: {
    item: PerjadinReportItem;
    sourceImage?: Blob | File | HTMLCanvasElement | null;
  }[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const sections = [];

  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    // Yield to UI thread
    await new Promise((r) => setTimeout(r, 10));

    const { item, sourceImage } = items[i];
    let imgResult: { data: Uint8Array; width: number; height: number } | null = null;
    if (sourceImage) {
      imgResult = await optimizeImageForDocx(sourceImage);
    }

    sections.push(buildPerjadinSection(item, imgResult));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24,
          },
          paragraph: {
            spacing: { line: 276, lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections,
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates individual `.docx` files for each report and packages them into a `.zip` file.
 */
export async function generateBulkZipPerjadinDocx(
  items: {
    item: PerjadinReportItem;
    sourceImage?: Blob | File | HTMLCanvasElement | null;
  }[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    await new Promise((r) => setTimeout(r, 10));

    const { item, sourceImage } = items[i];
    const docxBlob = await generateSinglePerjadinDocx(item, sourceImage);

    const safeDate = item.dateStr.replace(/[^0-9]/g, '');
    const safeLoc = item.tujuan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
    let fileName = `Perjadin_${safeDate}_${safeLoc}.docx`;
    let counter = 1;
    while (usedNames.has(fileName)) {
      fileName = `Perjadin_${safeDate}_${safeLoc}_${counter}.docx`;
      counter++;
    }
    usedNames.add(fileName);

    zip.file(fileName, docxBlob);
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
