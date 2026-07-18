const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const curriculumData = [
  {
    title: "Level 1: Fondasi Abjad & Angka",
    description: "Kuasai bentuk dasar tangan untuk alfabet (A-Z) dan angka (0-10) dalam SIBI.",
    level_order: 1,
    modules: [
      {
        title: "Modul 1.1: Alfabet A - E",
        description: "Fokus pada pengenalan bentuk kepalan dan jari dasar.",
        module_order: 1,
        lessons: [
          { title: "Huruf A", instruction: "Kepalkan tanganmu. Biarkan ibu jari tegak lurus dan menempel rapi di samping ruas luar jari telunjuk. Punggung tangan menghadap ke depan.", is_dynamic: false },
          { title: "Huruf B", instruction: "Buka telapak tanganmu menghadap ke depan. Rapatkan keempat jarimu (telunjuk hingga kelingking) tegak lurus ke atas. Tekuk ibu jarimu menyilang di depan telapak tangan.", is_dynamic: false },
          { title: "Huruf C", instruction: "Lengkungkan seluruh jarimu (termasuk ibu jari) hingga membentuk setengah lingkaran terbuka ke samping, seolah-olah kamu sedang memegang gelas air mineral.", is_dynamic: false },
          { title: "Huruf D", instruction: "Tegakkan jari telunjukmu lurus ke atas. Lengkungkan ketiga jari lainnya (tengah, manis, kelingking) hingga ujungnya menyentuh ujung ibu jari, membentuk lingkaran di bawah telunjuk.", is_dynamic: false },
          { title: "Huruf E", instruction: "Tekuk keempat jarimu ke bawah membentuk cakar rapat. Tekuk ibu jarimu ke dalam hingga ujungnya menyentuh pangkal jari-jari yang tertekuk tadi.", is_dynamic: false },
        ]
      },
      {
        title: "Modul 1.2: Alfabet F - J",
        description: "Mulai melibatkan kombinasi jari dan satu gestur dinamis.",
        module_order: 2,
        lessons: [
          { title: "Huruf F", instruction: "Sentuhkan ujung jari telunjuk dengan ujung ibu jari membentuk lingkaran sempurna. Biarkan tiga jari lainnya (tengah, manis, kelingking) tegak terpisah ke atas.", is_dynamic: false },
          { title: "Huruf G", instruction: "Kepalkan tangan menghadap ke dada, lalu luruskan jari telunjuk dan ibu jari ke samping secara sejajar. Jari lainnya tetap tertekuk.", is_dynamic: false },
          { title: "Huruf H", instruction: "Mirip dengan huruf G, namun luruskan jari telunjuk dan jari tengah secara bersamaan ke samping. Ibu jari menahan jari manis dan kelingking yang tertekuk.", is_dynamic: false },
          { title: "Huruf I", instruction: "Kepalkan tanganmu rapat-rapat, lalu tegakkan hanya jari kelingking lurus ke atas.", is_dynamic: false },
          { title: "Huruf J", instruction: "Mulailah dengan posisi huruf 'I' (kelingking tegak). Gunakan kelingkingmu untuk menggambar lengkungan huruf 'J' di udara, berayun ke arah dalam.", is_dynamic: true },
        ]
      },
      {
        title: "Modul 1.3: Alfabet K - O",
        description: "Fokus pada penempatan ibu jari di sela-sela jari.",
        module_order: 3,
        lessons: [
          { title: "Huruf K", instruction: "Tegakkan jari telunjuk ke atas dan jari tengah sedikit miring ke depan (membentuk huruf V). Letakkan ibu jari tegak menempel tepat di sela-sela pangkal telunjuk dan jari tengah.", is_dynamic: false },
          { title: "Huruf L", instruction: "Luruskan jari telunjuk ke atas dan ibu jari ke samping secara tegak lurus, membentuk sudut 90 derajat layaknya pistol atau huruf L. Jari lain dikepal.", is_dynamic: false },
          { title: "Huruf M", instruction: "Lipat jari telunjuk, jari tengah, dan jari manis ke bawah. Selipkan ibu jari di bawah ketiga jari tersebut (ibu jari menonjol di antara jari manis dan kelingking).", is_dynamic: false },
          { title: "Huruf N", instruction: "Mirip dengan huruf M, tetapi hanya jari telunjuk dan jari tengah yang dilipat menutupi ibu jari. Ibu jari menonjol di sela jari tengah dan manis.", is_dynamic: false },
          { title: "Huruf O", instruction: "Sentuhkan ujung semua jari (telunjuk hingga kelingking) ke ujung ibu jari hingga membentuk lingkaran menyerupai huruf O atau mulut bebek.", is_dynamic: false },
        ]
      },
      {
        title: "Modul 1.4: Alfabet P - T",
        description: "Variasi arah dan silangan jari.",
        module_order: 4,
        lessons: [
          { title: "Huruf P", instruction: "Buat posisi persis seperti huruf 'K' (telunjuk, tengah, dan ibu jari terbuka), namun arahkan pergelangan tanganmu menghadap ke bawah lantai.", is_dynamic: false },
          { title: "Huruf Q", instruction: "Buat posisi persis seperti huruf 'G' (telunjuk dan ibu jari lurus sejajar), namun arahkan telunjuk dan ibu jari menunjuk ke arah bawah lantai.", is_dynamic: false },
          { title: "Huruf R", instruction: "Silangkan jari telunjuk dan jari tengahmu (seperti isyarat cross-fingers untuk keberuntungan). Jari lainnya dikepal.", is_dynamic: false },
          { title: "Huruf S", instruction: "Kepalkan tanganmu erat-erat. Silangkan ibu jari tepat di depan bagian tengah jari-jari yang mengepal.", is_dynamic: false },
          { title: "Huruf T", instruction: "Kepalkan tanganmu, lalu selipkan ibu jarimu di sela-sela antara jari telunjuk dan jari tengah.", is_dynamic: false },
        ]
      },
      {
        title: "Modul 1.5: Alfabet U - Z",
        description: "Bentuk akhir alfabet dengan satu gestur dinamis.",
        module_order: 5,
        lessons: [
          { title: "Huruf U", instruction: "Tegakkan jari telunjuk dan jari tengah lurus ke atas dan rapatkan keduanya tanpa celah. Jari lainnya dikepal dan ditahan ibu jari.", is_dynamic: false },
          { title: "Huruf V", instruction: "Tegakkan jari telunjuk dan jari tengah ke atas, lalu pisahkan/renggangkan keduanya membentuk huruf V atau isyarat peace.", is_dynamic: false },
          { title: "Huruf W", instruction: "Tegakkan jari telunjuk, jari tengah, dan jari manis secara merenggang ke atas. Tahan kelingking dengan ibu jari.", is_dynamic: false },
          { title: "Huruf X", instruction: "Kepalkan tangan, lalu tegakkan jari telunjuk dan tekuk buku jarinya membentuk seperti kail pancing.", is_dynamic: false },
          { title: "Huruf Y", instruction: "Rentangkan ibu jari dan jari kelingking sejauh mungkin ke arah berlawanan, sementara tiga jari di tengah tetap dikepal erat (seperti isyarat menelepon).", is_dynamic: false },
          { title: "Huruf Z", instruction: "Kepalkan tangan dan tegakkan jari telunjuk. Gunakan ujung jari telunjukmu untuk menggambar pola huruf 'Z' zig-zag di udara.", is_dynamic: true },
        ]
      },
      {
        title: "Modul 1.6: Angka Dasar 0 - 5",
        description: "Isyarat angka menggunakan basis perhitungan standar satu tangan.",
        module_order: 6,
        lessons: [
          { title: "Angka 0", instruction: "Sentuhkan ujung semua jari ke ujung ibu jari membentuk lingkaran sempurna melompong di tengah, persis seperti huruf 'O'.", is_dynamic: false },
          { title: "Angka 1", instruction: "Kepalkan tangan menghadap ke depan, lalu tegakkan hanya jari telunjuk lurus ke atas.", is_dynamic: false },
          { title: "Angka 2", instruction: "Tegakkan jari telunjuk dan jari tengah terpisah membentuk huruf V.", is_dynamic: false },
          { title: "Angka 3", instruction: "Tegakkan jari telunjuk, jari tengah, dan jari manis secara merenggang. Ibu jari menahan kelingking.", is_dynamic: false },
          { title: "Angka 4", instruction: "Tegakkan dan rentangkan empat jarimu (telunjuk hingga kelingking) ke atas. Ibu jari ditekuk ke dalam telapak.", is_dynamic: false },
          { title: "Angka 5", instruction: "Buka telapak tanganmu dan rentangkan kelima jarimu (termasuk ibu jari) lebar-lebar.", is_dynamic: false },
        ]
      },
      {
        title: "Modul 1.7: Angka Lanjutan 6 - 10",
        description: "Menggunakan sistem kombinasi sentuhan ibu jari dengan jari lain (basis SIBI/ASL).",
        module_order: 7,
        lessons: [
          { title: "Angka 6", instruction: "Sentuhkan ujung ibu jari dengan ujung jari kelingking membentuk lingkaran. Biarkan tiga jari lainnya (telunjuk, tengah, manis) tegak merenggang.", is_dynamic: false },
          { title: "Angka 7", instruction: "Sentuhkan ujung ibu jari dengan ujung jari manis. Biarkan jari telunjuk, jari tengah, dan kelingking tegak merenggang.", is_dynamic: false },
          { title: "Angka 8", instruction: "Sentuhkan ujung ibu jari dengan ujung jari tengah. Biarkan jari telunjuk, jari manis, dan kelingking tegak.", is_dynamic: false },
          { title: "Angka 9", instruction: "Sentuhkan ujung ibu jari dengan ujung jari telunjuk. Biarkan jari tengah, manis, dan kelingking tegak (persis seperti bentuk huruf 'F').", is_dynamic: false },
          { title: "Angka 10", instruction: "Kepalkan tangan dan tegakkan ibu jari ke atas (seperti memberi jempol). Goyangkan ibu jari tersebut dengan memutar pergelangan tangan sedikit ke kiri dan kanan.", is_dynamic: true },
        ]
      }
    ]
  }
];

async function main() {
  console.log("Mulai melakukan seeding materi pelajaran...");

  // Hapus data lama agar tidak duplikat (opsional)
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.curriculumLevel.deleteMany();

  for (const levelData of curriculumData) {
    const level = await prisma.curriculumLevel.create({
      data: {
        title: levelData.title,
        description: levelData.description,
        level_order: levelData.level_order
      }
    });

    for (const modData of levelData.modules) {
      const mod = await prisma.module.create({
        data: {
          level_id: level.id,
          title: modData.title,
          description: modData.description,
          module_order: modData.module_order
        }
      });

      const lessonCreates = modData.lessons.map((l, index) => ({
        module_id: mod.id,
        title: l.title,
        instruction: l.instruction,
        is_dynamic: l.is_dynamic,
        lesson_order: index + 1
      }));

      await prisma.lesson.createMany({
        data: lessonCreates
      });
    }
  }

  console.log("Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
