import React from 'react';
import type { PerjadinReportItem } from '../perjadinTypes';

interface PerjadinSheetViewProps {
  item: PerjadinReportItem;
  imageSrc?: string | null;
  className?: string;
  isPrintOnly?: boolean;
  forceTwoPages?: boolean;
}

export const PerjadinSheetView: React.FC<PerjadinSheetViewProps> = ({
  item,
  imageSrc,
  className = '',
  isPrintOnly = false,
  forceTwoPages = false,
}) => {
  const hasST = Boolean(item.nomorST && item.nomorST.trim());
  let openingText: string;
  if (hasST) {
    const noSt = item.nomorST!.trim();
    const tglSt = item.tanggalST && item.tanggalST.trim() ? ` tanggal ${item.tanggalST.trim()}` : '';
    openingText = `Berdasarkan surat tugas nomor ${noSt}${tglSt} bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`;
  } else {
    openingText = `Berdasarkan surat tugas sebelumnya bersama ini disampaikan laporan perjalanan dinas kegiatan ${item.namaKegiatan} sebagai berikut:`;
  }

  // Heuristic for 2 pages: if uraian is long (>450 chars) or user forced 2 pages
  const isTwoPages = forceTwoPages || (item.uraian && item.uraian.length > 550);
  const targetPhotoHeight = item.photoTargetHeight || 185;

  const renderSheetOne = (showAllInOnePage: boolean) => (
    <div
      className="bg-white text-black text-left relative shadow-lg print:shadow-none"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12pt',
        lineHeight: 1.25,
        color: '#000000',
        width: '210mm',
        minHeight: '297mm',
        height: isPrintOnly ? '297mm' : 'auto',
        maxHeight: isPrintOnly ? '297mm' : undefined,
        padding: '10mm 12mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 1. Judul */}
      <div className="text-center font-bold mb-3 tracking-normal" style={{ fontSize: '12pt' }}>
        LAPORAN PERJALANAN DINAS
      </div>

      {/* 2. Header Table (Perihal & Tanggal) - NO BORDER per user specification */}
      <table className="w-full border-collapse border-none mb-3 text-[11.5pt] leading-tight">
        <tbody>
          <tr>
            <td className="border-none py-1 align-top w-[65%]">
              <span className="font-normal">
                Perihal &nbsp;: &nbsp;Laporan Perjalanan Dinas {item.namaKegiatan || '[Nama Kegiatan]'}
              </span>
            </td>
            <td className="border-none py-1 align-top text-right w-[35%] whitespace-nowrap">
              <span>{item.tanggalSurat}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. Kepada Yang Terhormat */}
      <div className="mb-3 space-y-0.5 leading-snug text-[11.5pt]">
        <div>Kepada Yang Terhormat:</div>
        <div className="pl-6">Kepala BPS Kabupaten Lombok Tengah</div>
        <div>di</div>
        <div className="pl-6">Tempat</div>
      </div>

      {/* 4. Kalimat Pembuka */}
      <div className="text-justify mb-3 leading-normal text-[11.5pt]">
        {openingText}
      </div>

      {/* 5. Tabel Rincian 1-6 */}
      <table className="w-full border-collapse border-none mb-1 text-[11.5pt] leading-snug">
        <tbody>
          <tr>
            <td className="w-7 align-top py-0.5">1.</td>
            <td className="w-52 align-top py-0.5">Nama</td>
            <td className="w-4 align-top py-0.5">:</td>
            <td className="align-top py-0.5 font-normal">{item.nama || '-'}</td>
          </tr>
          <tr>
            <td className="align-top py-0.5">2.</td>
            <td className="align-top py-0.5">Jabatan</td>
            <td className="align-top py-0.5">:</td>
            <td className="align-top py-0.5">{item.jabatan || '-'}</td>
          </tr>
          <tr>
            <td className="align-top py-0.5">3.</td>
            <td className="align-top py-0.5">Asal Satker</td>
            <td className="align-top py-0.5">:</td>
            <td className="align-top py-0.5">{item.asalSatker}</td>
          </tr>
          <tr>
            <td className="align-top py-0.5">4.</td>
            <td className="align-top py-0.5">Tujuan perjalanan</td>
            <td className="align-top py-0.5">:</td>
            <td className="align-top py-0.5">{item.tujuan || '-'}</td>
          </tr>
          <tr>
            <td className="align-top py-0.5">5.</td>
            <td className="align-top py-0.5">Hari, Tanggal</td>
            <td className="align-top py-0.5">:</td>
            <td className="align-top py-0.5">{item.hariTanggal}</td>
          </tr>
          <tr>
            <td className="align-top py-0.5">6.</td>
            <td className="align-top py-0.5">Uraian kegiatan perjalanan dinas</td>
            <td className="align-top py-0.5">:</td>
            <td className="align-top py-0.5"></td>
          </tr>
        </tbody>
      </table>

      {/* 6. Uraian Teks */}
      <div className="pl-9 pr-1 text-justify mb-3 leading-normal text-[11.5pt]">
        {item.uraian || '[Uraian pelaksanaan kegiatan perjalanan dinas belum diisi]'}
      </div>

      {showAllInOnePage && (
        <>
          {/* 7. Dokumentasi Header */}
          <table className="w-full border-collapse border-none mb-1 text-[11.5pt]">
            <tbody>
              <tr>
                <td className="w-7 align-top py-0.5">7.</td>
                <td className="w-52 align-top py-0.5">Dokumentasi</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5"></td>
              </tr>
            </tbody>
          </table>

          {/* 8. Foto Dokumentasi - Rata Tengah & Rasio Terjaga */}
          <div className="w-full flex justify-center items-center my-3">
            {imageSrc ? (
              <div className="inline-block border border-zinc-300 shadow-xs overflow-hidden">
                <img
                  src={imageSrc}
                  alt="Dokumentasi Perjadin Ber-stempel"
                  style={{
                    height: `${targetPhotoHeight}px`,
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                  className="bg-zinc-900"
                />
              </div>
            ) : (
              <div className="w-[320px] h-36 border border-dashed border-zinc-400 bg-zinc-50 flex items-center justify-center text-zinc-500 italic text-sm">
                [Foto Dokumentasi Ber-stempel]
              </div>
            )}
          </div>

          {/* 9. Tanda Tangan */}
          <table className="w-full border-collapse border-none mt-4 text-[11.5pt]">
            <tbody>
              <tr>
                <td className="w-[50%]"></td>
                <td className="w-[50%] text-center">
                  <div>Pelaksana perjalanan dinas</div>
                  <div className="h-16"></div>
                  <div className="font-normal">{item.nama || '(Nama Pegawai)'}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Page number badge */}
      {isTwoPages && (
        <div className="absolute bottom-2 right-4 text-[9pt] text-zinc-400 print:hidden">
          Halaman 1 dari 2
        </div>
      )}
    </div>
  );

  const renderSheetTwo = () => (
    <div
      className="bg-white text-black text-left relative shadow-lg print:shadow-none perjadin-page-break"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12pt',
        lineHeight: 1.25,
        color: '#000000',
        width: '210mm',
        minHeight: '297mm',
        height: isPrintOnly ? '297mm' : 'auto',
        maxHeight: isPrintOnly ? '297mm' : undefined,
        padding: '10mm 12mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 7. Dokumentasi Header */}
      <table className="w-full border-collapse border-none mb-2 text-[11.5pt]">
        <tbody>
          <tr>
            <td className="w-7 align-top py-0.5">7.</td>
            <td className="w-52 align-top py-0.5 font-bold">Dokumentasi (Lanjutan)</td>
            <td className="w-4 align-top py-0.5">:</td>
            <td className="align-top py-0.5"></td>
          </tr>
        </tbody>
      </table>

      {/* Foto Dokumentasi - Rata Tengah & Rasio Terjaga */}
      <div className="w-full flex justify-center items-center my-6">
        {imageSrc ? (
          <div className="inline-block border border-zinc-300 shadow-xs overflow-hidden">
            <img
              src={imageSrc}
              alt="Dokumentasi Perjadin Ber-stempel"
              style={{
                height: `${Math.round(targetPhotoHeight * 1.25)}px`,
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              className="bg-zinc-900"
            />
          </div>
        ) : (
          <div className="w-[360px] h-44 border border-dashed border-zinc-400 bg-zinc-50 flex items-center justify-center text-zinc-500 italic text-sm">
            [Foto Dokumentasi Ber-stempel]
          </div>
        )}
      </div>

      {/* Tanda Tangan */}
      <table className="w-full border-collapse border-none mt-16 text-[11.5pt]">
        <tbody>
          <tr>
            <td className="w-[50%]"></td>
            <td className="w-[50%] text-center">
              <div>Pelaksana perjalanan dinas</div>
              <div className="h-20"></div>
              <div className="font-normal">{item.nama || '(Nama Pegawai)'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Page number badge */}
      <div className="absolute bottom-2 right-4 text-[9pt] text-zinc-400 print:hidden">
        Halaman 2 dari 2
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {renderSheetOne(!isTwoPages)}
      {isTwoPages && renderSheetTwo()}
    </div>
  );
};
