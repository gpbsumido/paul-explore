# Real CTA cases

## avt-r6.u8.gz

Case R6 from the Aortic Vessel Tree (AVT) CTA collection.

- L. Radl, Y. Jin, A. Pepe, J. Li, C. Gsaxner, F. Zhao, J. Egger. "AVT: Multicenter Aortic Vessel Tree CTA Dataset Collection with Ground Truth Segmentation Masks". Data in Brief 40, 107801, 2022.
- L. Radl et al. "Aortic Vessel Tree (AVT) CTA Datasets and Segmentations". figshare, 2021. https://doi.org/10.6084/m9.figshare.14806362 (CC BY 4.0)
- The AVT Rider cases build on: B. Zhao, L. H. Schwartz, M. G. Kris. "Data From RIDER_Lung CT". The Cancer Imaging Archive, 2015. https://doi.org/10.7937/K9/TCIA.2015.U1X8A5NR (CC BY 4.0)

Licence: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/

Changes made with `scripts/prepare-evar-scan.mjs`: cropped to 256 by 256 pixels around the abdominal aorta and iliacs at the original 0.7246 mm spacing, kept from 296 to 550 mm below the top of the scan, averaged into 2 mm slices from the original 0.625 mm, shifted by the stored +1024 offset to Hounsfield units, and stored one byte a voxel as `round((HU + 160) / 2.4)`, clamped to 0 to 255.
