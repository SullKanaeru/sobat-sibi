import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-8 pb-8 flex flex-col items-start gap-6 border-t border-gray-200 mt-12 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Sobat SIBI
        </h3>
        <p className="text-xs text-gray-500">
          © 2026 Sobat SIBI. Mulai Belajar Bahasa Isyarat.
        </p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-500 font-medium md:pr-24">
        <Link href="/kebijakan-privasi" className="hover:text-blue-700 transition-colors">
          Kebijakan Privasi
        </Link>
        <Link href="/syarat-ketentuan" className="hover:text-blue-700 transition-colors">
          Syarat & Ketentuan
        </Link>
        <Link href="/aksesibilitas" className="hover:text-blue-700 transition-colors">
          Aksesibilitas
        </Link>
        <Link href="/kontak" className="hover:text-blue-700 transition-colors">
          Kontak
        </Link>
      </div>
    </footer>
  );
}
