export interface MatrixRow {
  criteria: string;
  notes?: string;
  upperBeginner: boolean | null;
  bronze: boolean | null;
  openMen?: boolean | null;
  mensOpen?: boolean | null;
  silver?: boolean | null;
}

export interface CriteriaSection {
  title: string;
  icon: string;
  rows: MatrixRow[];
}

export interface CategoryEligibility {
  name: string;
  quota?: string;
  tier: "Upper Beginner" | "Bronze" | "Silver" | "Open" | "Youth";
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
        openMen: null,
      },
      {
        criteria: "Advanced Tennis Players (Current or Ex-Junior Tennis)",
        notes: "Pemain tenis mahir / mantan pemain junior resmi",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "Intermediate Tennis Players",
        notes: "Pemain tenis level menengah",
        upperBeginner: false,
        bronze: true,
        openMen: null,
      },
      {
        criteria: "Beginner Tennis Players",
        notes: "Pemain tenis pemula / recreational player",
        upperBeginner: true,
        bronze: true,
        openMen: null,
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
        openMen: null,
      },
      {
        criteria: "Semifinalist or Higher of Gold / Open Level Tournament",
        notes: "Semifinalis, finalis, atau juara turnamen kategori Gold / Open",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "Current / Ex PON Player",
        notes: "Pemain PON padel aktif maupun mantan atlet PON",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "2x Winner (Juara 1) of Silver Level Tournament",
        notes: "Pernah menjuarai turnamen kategori Silver minimal 2 kali",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "3x Finalist of Silver Level Tournament",
        notes: "Pernah menjadi finalis turnamen kategori Silver minimal 3 kali",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "Padel Coach or Tennis Coach (licensed or unlicensed)",
        notes:
          "Pelatih padel atau tenis (baik berlisensi maupun tidak berlisensi)",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "Semifinalist or Higher of Silver Level Tournament",
        notes: "Semifinalis atau lebih tinggi di turnamen Silver",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "2x Winner (Juara 1) of Bronze Tournament",
        notes: "Pernah menjuarai turnamen kategori Bronze minimal 2 kali",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria: "3x Finalist of Bronze Level Tournament",
        notes: "Pernah menjadi finalis turnamen kategori Bronze minimal 3 kali",
        upperBeginner: false,
        bronze: false,
        openMen: null,
      },
      {
        criteria:
          "2x Winner (Juara 1) of Beginner Tournament (with different partner)",
        notes:
          "Pernah 2x juara 1 turnamen Beginner dengan pasangan yang berbeda",
        upperBeginner: false,
        bronze: true,
        openMen: null,
      },
      {
        criteria: "Any lower qualifications than mentioned all above",
        notes:
          "Pemain dengan kualifikasi di bawah kriteria di atas (recreational / pemula murni)",
        upperBeginner: true,
        bronze: true,
        openMen: null,
      },
    ],
  },
];

export const CAPRIVAL_YOUTH_QUALIFICATION = {
  category: "KU-14 Men",
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
    const isMen = norm.includes("men") && !norm.includes("women");
    return {
      name: categoryName,
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

  if (norm.includes("open") || norm.includes("silver")) {
    return {
      name: "Mens Open",
      tier: "Open",
      badgeText: "Mens Open",
      description:
        "Kategori terbuka putra (Mens Open) tanpa batasan kualifikasi khusus, terbuka untuk pemain dari berbagai tingkat kemahiran.",
      allowedList: [
        "Terbuka untuk seluruh pemain putra (Mens Open Category)",
        "Pemain tenis & padel dari berbagai tingkat kemahiran",
      ],
      disallowedList: [],
    };
  }

  if (
    norm.includes("ku-14") ||
    norm.includes("ku 14") ||
    norm.includes("u-14")
  ) {
    return {
      name: categoryName,
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
