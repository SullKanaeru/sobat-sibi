// ── constants/kamus.js ─────────────────────────────────────────────────────────

import { Type, Hash, AlignLeft, Camera } from "lucide-react";

export const MEDIAPIPE_CDN =
  "https://unpkg.com/@mediapipe/hands@0.4.1675469240";

export const EMPTY_RESULT = {
  char: "--",
  confidence: 0,
  smoothedChar: "--",
  isConfident: false,
};

export const SIDEBAR_MENUS = [
  { id: "huruf", label: "Huruf", icon: Type },
  { id: "angka", label: "Angka", icon: Hash },
  { id: "kata", label: "Kata", icon: AlignLeft }
];

export const DICTIONARY_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export const LETTER_DESCRIPTIONS = {
  A: "Kepalkan tangan dengan ibu jari di sisi luar.",
  B: "Tegakkan empat jari rapat, ibu jari dilipat ke dalam.",
  C: "Lengkungkan jari-jari membentuk huruf C.",
  D: "Telunjuk tegak, jari lain membentuk lingkaran menyentuh ibu jari.",
  E: "Tekuk semua jari ke bawah, ibu jari di bawah jari lainnya.",
  F: "Ibu jari dan telunjuk membentuk lingkaran, tiga jari lainnya tegak.",
  G: "Telunjuk dan ibu jari sejajar horizontal menunjuk ke kanan.",
  H: "Telunjuk dan jari tengah sejajar horizontal.",
  I: "Kepalkan tangan, jari kelingking tegak ke atas.",
  J: "Seperti I lalu gambar huruf J di udara dengan kelingking.",
  K: "Telunjuk tegak, jari tengah miring, ibu jari di antara keduanya.",
  L: "Ibu jari dan telunjuk membentuk sudut 90 derajat.",
  M: "Tiga jari (telunjuk, tengah, manis) dilipat di atas ibu jari.",
  N: "Dua jari (telunjuk dan tengah) dilipat di atas ibu jari.",
  O: "Semua jari dan ibu jari membentuk lingkaran huruf O.",
  P: "Seperti K namun dibalik ke bawah.",
  Q: "Seperti G namun ibu jari dan telunjuk mengarah ke bawah.",
  R: "Telunjuk dan jari tengah disilangkan, tegak ke atas.",
  S: "Kepalkan tangan, ibu jari di depan jari-jari.",
  T: "Ibu jari di antara telunjuk dan jari tengah yang digenggam.",
  U: "Telunjuk dan jari tengah tegak rapat berdampingan.",
  V: "Telunjuk dan jari tengah tegak membentuk huruf V.",
  W: "Telunjuk, jari tengah, dan jari manis tegak membentuk huruf W.",
  X: "Telunjuk ditekuk membentuk kait.",
  Y: "Ibu jari dan kelingking terbuka, tiga jari lainnya mengepal.",
  Z: "Telunjuk tegak lalu gambar huruf Z di udara.",
};