import os
import zipfile
import urllib.request
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.subset import main as subset_main

REPO_ROOT = Path(r"c:\Users\nanak\Desktop\Padel_League")
FONTS_DIR = REPO_ROOT / "apps" / "mobile" / "assets" / "fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)

SCRATCH_DIR = Path(r"C:\Users\nanak\.gemini\antigravity\brain\9b01184d-f5bd-4628-bda9-71b46a32bcaf\scratch")
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
ZIP_PATH = SCRATCH_DIR / "Inter-4.1.zip"

UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+20A0-20CF"

def run_subset(in_font, out_font, flavor=None):
    args = [
        str(in_font),
        f"--output-file={out_font}",
        f"--unicodes={UNICODES}",
        "--layout-features=kern,liga,calt,tnum,pnum",
    ]
    if flavor:
        args.append(f"--flavor={flavor}")
    
    print(f"Subsetting {in_font.name} -> {out_font.name} (flavor={flavor})...")
    subset_main(args)

def main():
    var_in = SCRATCH_DIR / "InterVariable.ttf"
    reg_in = SCRATCH_DIR / "extras" / "ttf" / "Inter-Regular.ttf"
    med_in = SCRATCH_DIR / "extras" / "ttf" / "Inter-Medium.ttf"
    semi_in = SCRATCH_DIR / "extras" / "ttf" / "Inter-SemiBold.ttf"
    
    # 1. Web variable woff2
    var_out_woff2 = FONTS_DIR / "InterVariable.woff2"
    run_subset(var_in, var_out_woff2, flavor="woff2")
    
    # 2. Native static TTFs
    reg_out = FONTS_DIR / "Inter-Regular.ttf"
    med_out = FONTS_DIR / "Inter-Medium.ttf"
    semi_out = FONTS_DIR / "Inter-SemiBold.ttf"
    
    run_subset(reg_in, reg_out)
    run_subset(med_in, med_out)
    run_subset(semi_in, semi_out)
    
    print("\n=== FINAL GENERATED FONTS SUMMARY ===")
    for path in [var_out_woff2, reg_out, med_out, semi_out]:
        size = path.stat().st_size
        tt = TTFont(str(path))
        has_cedi = False
        for table in tt['cmap'].tables:
            if 0x20B5 in table.cmap:
                has_cedi = True
                break
        print(f"File: {path.name:22} Size: {size/1024:6.2f} KB ({size} bytes) | Cedi (U+20B5) present: {has_cedi}")

if __name__ == "__main__":
    main()
