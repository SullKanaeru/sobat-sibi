const { PrismaClient } = require('@prisma/client');
const knowledgeBase = require('../src/data/sibi_knowledge.json');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  for (const item of knowledgeBase) {
    // Upsert to avoid duplicates if run multiple times
    const entry = await prisma.dictionary.findFirst({
      where: { text: item.text, dict_type: item.dict_type }
    });

    if (!entry) {
      await prisma.dictionary.create({
        data: {
          text: item.text,
          dict_type: item.dict_type,
          description: item.description,
          image_url: item.image_url
        }
      });
      console.log(`Created dictionary entry for ${item.text}`);
    } else {
      await prisma.dictionary.update({
        where: { id: entry.id },
        data: {
          description: item.description,
          image_url: item.image_url
        }
      });
      console.log(`Updated dictionary entry for ${item.text}`);
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
