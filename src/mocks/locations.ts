export const regions = [
  {
    id: 'region-1',
    name: 'Region 1 — Barima-Waini',
    majorTowns: ['Mabaruma', 'Port Kaituma', 'Morawhanna'],
    contractorCount: 0,
  },
  {
    id: 'region-2',
    name: 'Region 2 — Pomeroon-Supenaam',
    majorTowns: ['Anna Regina', 'Charity', 'Suddie'],
    contractorCount: 0,
  },
  {
    id: 'region-3',
    name: 'Region 3 — Essequibo Islands-West Demerara',
    majorTowns: ['Vreed en Hoop', 'Parika', 'Schoonord', 'Wales'],
    contractorCount: 4,
  },
  {
    id: 'region-4',
    name: 'Region 4 — Demerara-Mahaica',
    majorTowns: ['Georgetown', 'Kitty', 'Campbellville', 'Diamond', 'Grove', 'Buxton'],
    contractorCount: 5,
  },
  {
    id: 'region-5',
    name: 'Region 5 — Mahaica-Berbice',
    majorTowns: ['Rosignol', 'Fort Wellington', 'Mahaicony'],
    contractorCount: 3,
  },
  {
    id: 'region-6',
    name: 'Region 6 — East Berbice-Corentyne',
    majorTowns: ['New Amsterdam', 'Corentyne', 'Rose Hall Town', 'Corriverton', 'Skeldon'],
    contractorCount: 6,
  },
  {
    id: 'region-7',
    name: 'Region 7 — Cuyuni-Mazaruni',
    majorTowns: ['Bartica', 'Kamarang', 'Issano'],
    contractorCount: 0,
  },
  {
    id: 'region-8',
    name: 'Region 8 — Potaro-Siparuni',
    majorTowns: ['Mahdia', 'Tumatumari', 'Kato'],
    contractorCount: 0,
  },
  {
    id: 'region-9',
    name: 'Region 9 — Upper Takutu-Upper Essequibo',
    majorTowns: ['Lethem', 'Aishalton', 'Annai'],
    contractorCount: 0,
  },
  {
    id: 'region-10',
    name: 'Region 10 — Upper Demerara-Berbice',
    majorTowns: ['Linden', 'Ituni', 'Kwakwani'],
    contractorCount: 0,
  },
];

export const allTowns = regions.flatMap((r) =>
  r.majorTowns.map((t) => ({
    name: t,
    region: r.name,
    regionId: r.id,
    contractorCount: r.contractorCount,
  })),
);

export function getRegionByName(name: string) {
  return regions.find((r) => r.name === name || r.name.includes(name));
}

export function getRegionById(id: string) {
  return regions.find((r) => r.id === id);
}

export const REGIONS = regions.map((r) => {
  const shortName = r.name.split(' — ')[0] || r.name;
  return {
    value: shortName,
    label: r.name,
  };
});