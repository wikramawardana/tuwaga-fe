export interface MatrixRow {
  criteria: string;
  notes?: string;
  upperBeginner: boolean;
  bronze: boolean;
  silver: boolean;
}

export interface CriteriaSection {
  title: string;
  icon: string;
  rows: MatrixRow[];
}

export interface CategoryEligibility {
  name: string;
  quota: string;
  tier: "Upper Beginner" | "Bronze" | "Silver" | "Youth";
  badgeText: string;
  allowedList: string[];
  disallowedList: string[];
  youthRule?: string;
  description: string;
}

export const CAPRIVAL_TOURNAMENT_SLUG = "the-grand-caprival";

export function isCaprivalTournament(slugOrId?: string | null): boolean {
  if (!slugOrId) return false;
  const s = slugOrId.toLowerCase();
  return s === CAPRIVAL_TOURNAMENT_SLUG || s.includes("caprival");
}

export const CAPRIVAL_QUALIFICATION_SECTIONS: CriteriaSection[] = [
  {
    title: "In Other Racket Sports (Cabor Raket Lain / Tenis)",
    icon: "sports_tennis",
    rows: [
      {
        criteria: "Pro / Ex-Pro Racket Sports Athletes within 5 years",
        notes:
          "Atlet profesional / mantan atlet raket dalam kurun waktu 5 tahun terakhir",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "Advanced Tennis Players (Current or Ex-Junior Tennis)",
        notes: "Pemain tenis mahir / mantan pemain junior resmi",
        upperBeginner: false,
        bronze: false,
        silver: true,
      },
      {
        criteria: "Intermediate Tennis Players",
        notes: "Pemain tenis level menengah",
        upperBeginner: false,
        bronze: true,
        silver: true,
      },
      {
        criteria: "Beginner Tennis Players",
        notes: "Pemain tenis pemula / recreational player",
        upperBeginner: true,
        bronze: true,
        silver: true,
      },
    ],
  },
  {
    title: "In Padel (Cabang Padel)",
    icon: "sports_baseball",
    rows: [
      {
        criteria: "Current or Ex-Pro Players",
        notes: "Pemain pro aktif maupun mantan pro padel",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "Semifinalist or Higher of Gold / Open Level Tournament",
        notes: "Semifinalis, finalis, atau juara turnamen kategori Gold / Open",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "Current / Ex PON Player",
        notes: "Pemain PON padel aktif maupun mantan atlet PON",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "2x Winner (Juara 1) of Silver Level Tournament",
        notes: "Pernah menjuarai turnamen kategori Silver minimal 2 kali",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "3x Finalist of Silver Level Tournament",
        notes: "Pernah menjadi finalis turnamen kategori Silver minimal 3 kali",
        upperBeginner: false,
        bronze: false,
        silver: false,
      },
      {
        criteria: "Padel Coach or Tennis Coach (licensed or unlicensed)",
        notes:
          "Pelatih padel atau tenis (baik berlisensi maupun tidak berlisensi)",
        upperBeginner: false,
        bronze: false,
        silver: true,
      },
      {
        criteria: "Semifinalist or Higher of Silver Level Tournament",
        notes: "Semifinalis atau lebih tinggi di turnamen Silver",
        upperBeginner: false,
        bronze: false,
        silver: true,
      },
      {
        criteria: "2x Winner (Juara 1) of Bronze Tournament",
        notes: "Pernah menjuarai turnamen kategori Bronze minimal 2 kali",
        upperBeginner: false,
        bronze: false,
        silver: true,
      },
      {
        criteria: "3x Finalist of Bronze Level Tournament",
        notes: "Pernah menjadi finalis turnamen kategori Bronze minimal 3 kali",
        upperBeginner: false,
        bronze: false,
        silver: true,
      },
      {
        criteria:
          "2x Winner (Juara 1) of Beginner Tournament (with different partner)",
        notes:
          "Pernah 2x juara 1 turnamen Beginner dengan pasangan yang berbeda",
        upperBeginner: false,
        bronze: true,
        silver: true,
      },
      {
        criteria: "Any lower qualifications than mentioned all above",
        notes:
          "Pemain dengan kualifikasi di bawah kriteria di atas (recreational / pemula murni)",
        upperBeginner: true,
        bronze: true,
        silver: true,
      },
    ],
  },
];

export const CAPRIVAL_YOUTH_QUALIFICATION = {
  category: "KU-14 Men",
  quota: "24 Pasang (24 Pair)",
  title: "Youth Player Qualification (KU-14)",
  rule: "Born in 2012 or Later",
  indonesianRule:
    "Wajib kelahiran tahun 2012 atau setelahnya (Maksimal usia 14 tahun saat turnamen).",
  verification:
    "Wajib melampirkan foto Kartu Identitas Anak (KIA), Akta Kelahiran, atau Kartu Pelajar yang valid saat pendaftaran.",
};

export function getCaprivalCategoryEligibility(
  categoryName: string,
): CategoryEligibility | null {
  const norm = categoryName.trim().toLowerCase();

  if (norm.includes("upper beginner")) {
    return {
      name: categoryName,
      quota: "24 Pasang (24 Pair)",
      tier: "Upper Beginner",
      badgeText: "Pemula Murni / Beginner Tennis",
      description:
        "Kategori khusus pemula putri dengan kurasi ketat level keterampilan tenis & padel.",
      allowedList: [
        "Pemain tenis pemula (Beginner Tennis Players)",
        "Pemain padel pemula yang belum pernah mencapai final/semifinal turnamen resmi",
        "Pemain dengan kualifikasi recreational yang belum memiliki rekam jejak turnamen kompetitif",
      ],
      disallowedList: [
        "Atlet pro / mantan atlet raket (tenis/badminton/squash/padel) dalam 5 tahun terakhir",
        "Pemain tenis Intermediate maupun Advanced (mantan petenis junior resmi)",
        "Pemain / mantan pemain PON atau atlet pro padel",
        "Pelatih (coach) padel maupun tenis (berlisensi maupun non-lisensi)",
        "Pernah semifinalis/finalis/juara di turnamen Bronze, Silver, maupun Gold",
      ],
    };
  }

  if (norm.includes("bronze")) {
    const isMen = norm.includes("men");
    return {
      name: categoryName,
      quota: "24 Pasang (24 Pair)",
      tier: "Bronze",
      badgeText: isMen ? "Bronze Men" : "Bronze Women",
      description:
        "Kategori kompetitif untuk pemain level intermediate tenis atau peraih prestasi turnamen beginner.",
      allowedList: [
        "Pemain tenis level Intermediate atau Beginner",
        "Pernah 2x Juara 1 turnamen Beginner (dengan pasangan yang berbeda)",
        "Pemain padel recreational dengan rekam jejak di bawah kategori perak/emas",
      ],
      disallowedList: [
        "Pemain tenis Advanced / mantan petenis junior resmi",
        "Atlet pro / mantan atlet cabang raket dalam 5 tahun terakhir",
        "Pelatih (coach) padel atau tenis (berlisensi maupun non-lisensi)",
        "Pernah 2x Juara 1 turnamen Bronze atau 3x Finalis turnamen Bronze",
        "Pernah Semifinalis, Finalis, atau Juara di turnamen Silver maupun Gold/Open",
        "Atlet / mantan atlet PON atau pro player padel",
      ],
    };
  }

  if (norm.includes("silver")) {
    return {
      name: categoryName,
      quota: "24 Pasang (24 Pair)",
      tier: "Silver",
      badgeText: "Silver Open",
      description:
        "Kategori terbuka tingkat lanjut dengan intensitas tinggi, terbuka untuk petenis mahir & pelatih.",
      allowedList: [
        "Pemain tenis level Advanced (termasuk mantan petenis junior)",
        "Pemain tenis level Intermediate & Beginner",
        "Pelatih padel atau tenis (berlisensi maupun non-lisensi)",
        "Semifinalis atau peraih podium turnamen Silver",
        "Pernah menjuarai (Juara 1) turnamen Bronze 2 kali atau finalis 3 kali",
      ],
      disallowedList: [
        "Atlet pro / mantan pro cabang olahraga raket dalam kurun waktu 5 tahun terakhir",
        "Pemain pro aktif / mantan pro padel",
        "Semifinalis atau peringkat lebih tinggi di turnamen Gold / Open Level",
        "Pemain PON (aktif maupun mantan kontingen PON)",
        "Pernah 2x Juara 1 turnamen Silver atau 3x Finalis turnamen Silver",
      ],
    };
  }

  if (
    norm.includes("ku-14") ||
    norm.includes("ku 14") ||
    norm.includes("u-14")
  ) {
    return {
      name: categoryName,
      quota: "24 Pasang (24 Pair)",
      tier: "Youth",
      badgeText: "U-14 Kelahiran 2012+",
      description:
        "Kategori pembinaan junior putra dengan batasan ketat usia pemain.",
      allowedList: [
        "Pemain putra dengan tahun kelahiran 2012, 2013, 2014, atau setelahnya",
        "Melampirkan kartu identitas resmi (KIA / Akta / Kartu Pelajar) yang valid",
      ],
      disallowedList: [
        "Pemain yang lahir sebelum 1 Januari 2012 (usia di atas 14 tahun)",
        "Pemain yang tidak dapat membuktikan data tahun kelahiran resmi",
      ],
      youthRule: "Wajib kelahiran 2012 atau setelahnya (Maksimal 14 tahun)",
    };
  }

  return null;
}
