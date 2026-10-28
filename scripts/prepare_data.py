"""
Data Preparation Script for SLS Photo Stamping & Geotagging Web App.
Splits `peta_sls_20260202.geojson` (23 MB) into:
1. `public/data/hierarchy.json`: Compact hierarchical index & flat search list.
2. `public/data/boundaries/{kdkec}.json`: Lazy-loaded GeoJSON boundaries per Kecamatan
   with precomputed centroids and rounded 6-decimal coordinates (EPSG:4326).
"""

import json
import os
from pathlib import Path
import geopandas as gpd
from shapely.geometry import mapping


def round_coords(coords, precision=6):
    if isinstance(coords[0], (int, float)):
        return [round(c, precision) for c in coords[:2]]
    return [round_coords(c, precision) for c in coords]


def main():
    workspace_dir = Path(r"e:\@ANDIKA\2026\1. Peta Digital\Peta\Batas SLS 2026")
    source_path = workspace_dir / "peta_sls_20260202.geojson"
    out_dir = workspace_dir / "public" / "data"
    boundaries_dir = out_dir / "boundaries"

    out_dir.mkdir(parents=True, exist_ok=True)
    boundaries_dir.mkdir(parents=True, exist_ok=True)

    print(f"Reading {source_path}...")
    gdf = gpd.read_file(source_path)

    # Verify CRS is EPSG:4326
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    # Sort nicely by kdkec, iddesa, idsls, idsubsls
    gdf = gdf.sort_values(by=["kdkec", "iddesa", "idsls", "idsubsls"]).reset_index(drop=True)

    # Build hierarchy structure
    # kec_map: { kdkec: { kdkec, nmkec, desa: { iddesa: { iddesa, kddesa, nmdesa, sls: { idsls: { idsls, kdsls, nmsls, subsls: [...] } } } } } }
    kec_map = {}

    for _, row in gdf.iterrows():
        kdkec = str(row["kdkec"]).strip()
        nmkec = str(row["nmkec"]).strip()
        iddesa = str(row["iddesa"]).strip()
        kddesa = str(row["kddesa"]).strip()
        nmdesa = str(row["nmdesa"]).strip()
        idsls = str(row["idsls"]).strip()
        kdsls = str(row["kdsls"]).strip()
        nmsls = str(row["nmsls"]).strip()
        kdsubsls = str(row["kdsubsls"]).strip() if row["kdsubsls"] is not None else "00"
        idsubsls = str(row["idsubsls"]).strip()

        if kdkec not in kec_map:
            kec_map[kdkec] = {
                "kdkec": kdkec,
                "nmkec": nmkec,
                "desa": {}
            }
        desa_map = kec_map[kdkec]["desa"]
        if iddesa not in desa_map:
            desa_map[iddesa] = {
                "iddesa": iddesa,
                "kddesa": kddesa,
                "nmdesa": nmdesa,
                "sls": {}
            }
        sls_map = desa_map[iddesa]["sls"]
        if idsls not in sls_map:
            sls_map[idsls] = {
                "idsls": idsls,
                "kdsls": kdsls,
                "nmsls": nmsls,
                "subsls": []
            }
        sls_map[idsls]["subsls"].append({
            "idsubsls": idsubsls,
            "kdsubsls": kdsubsls
        })

    # Convert nested dicts to sorted lists for clean frontend consumption
    hierarchy_list = []
    for kdkec in sorted(kec_map.keys()):
        kec_obj = kec_map[kdkec]
        desa_list = []
        for iddesa in sorted(kec_obj["desa"].keys()):
            desa_obj = kec_obj["desa"][iddesa]
            sls_list = []
            for idsls in sorted(desa_obj["sls"].keys()):
                sls_obj = desa_obj["sls"][idsls]
                sls_list.append({
                    "idsls": sls_obj["idsls"],
                    "kdsls": sls_obj["kdsls"],
                    "nmsls": sls_obj["nmsls"],
                    "subsls": sls_obj["subsls"]
                })
            desa_list.append({
                "iddesa": desa_obj["iddesa"],
                "kddesa": desa_obj["kddesa"],
                "nmdesa": desa_obj["nmdesa"],
                "sls": sls_list
            })
        hierarchy_list.append({
            "kdkec": kec_obj["kdkec"],
            "nmkec": kec_obj["nmkec"],
            "desa": desa_list
        })

    hierarchy_payload = {
        "kabupaten": "LOMBOK TENGAH",
        "provinsi": "NUSA TENGGARA BARAT",
        "kdprov": "52",
        "kdkab": "02",
        "total_kec": len(hierarchy_list),
        "total_subsls": len(gdf),
        "kecamatan": hierarchy_list
    }

    hierarchy_file = out_dir / "hierarchy.json"
    with open(hierarchy_file, "w", encoding="utf-8") as f:
        json.dump(hierarchy_payload, f, separators=(",", ":"), ensure_ascii=False)

    print(f"Saved {hierarchy_file} ({hierarchy_file.stat().st_size / 1024:.1f} KB)")

    # Export per-kecamatan boundary files
    for kdkec, group in gdf.groupby("kdkec"):
        kdkec_str = str(kdkec).strip()
        features = []
        for _, row in group.iterrows():
            geom = row["geometry"]
            # Representative point guaranteed to be inside the polygon
            rep_pt = geom.representative_point()
            centroid = geom.centroid
            # Use representative_point if centroid is not inside polygon
            fallback_pt = centroid if geom.contains(centroid) else rep_pt

            geom_dict = mapping(geom)
            geom_dict["coordinates"] = round_coords(geom_dict["coordinates"], 6)
            bounds = [round(b, 6) for b in geom.bounds]  # [minX, minY, maxX, maxY]

            features.append({
                "type": "Feature",
                "properties": {
                    "idsubsls": str(row["idsubsls"]).strip(),
                    "kdsubsls": str(row["kdsubsls"]).strip() if row["kdsubsls"] is not None else "00",
                    "idsls": str(row["idsls"]).strip(),
                    "kdsls": str(row["kdsls"]).strip(),
                    "nmsls": str(row["nmsls"]).strip(),
                    "iddesa": str(row["iddesa"]).strip(),
                    "kddesa": str(row["kddesa"]).strip(),
                    "nmdesa": str(row["nmdesa"]).strip(),
                    "kdkec": kdkec_str,
                    "nmkec": str(row["nmkec"]).strip(),
                    "bbox": bounds,
                    "fallback_lng": round(fallback_pt.x, 6),
                    "fallback_lat": round(fallback_pt.y, 6)
                },
                "geometry": geom_dict
            })

        fc = {
            "type": "FeatureCollection",
            "kdkec": kdkec_str,
            "features": features
        }
        kec_file = boundaries_dir / f"{kdkec_str}.json"
        with open(kec_file, "w", encoding="utf-8") as f:
            json.dump(fc, f, separators=(",", ":"), ensure_ascii=False)
        print(f"Saved {kec_file.name}: {len(features)} features ({kec_file.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
