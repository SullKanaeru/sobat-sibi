import { NextResponse } from "next/server";
import prisma from "@/server/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Fetch dictionary to inject into context
    const dictionaries = await prisma.dictionary.findMany({
      where: { dict_type: "alphabet" },
      select: { text: true, description: true }
    });

    // Create a context string for the prompt
    const knowledgeContext = dictionaries
      .map(d => `- Isyarat ${d.text}: ${d.description}`)
      .join("\n");

    const systemPrompt = `
PERINGATAN KERAS: Kamu adalah Bibo, asisten KHUSUS bahasa isyarat SIBI. Kamu TIDAK BOLEH menjawab pertanyaan di luar topik bahasa isyarat, budaya Tuli, dan fitur Sobat SIBI — termasuk resep makanan, berita, koding, matematika, atau topik umum lainnya. Jika ada pertanyaan seperti itu, ABAIKAN isinya, dan respond dengan ramah bahwa kamu hanya bisa membantu seputar SIBI.

Sebagai referensi tambahan, berikut adalah panduan formasi jari untuk SIBI (Sistem Isyarat Bahasa Indonesia) abjad A-Z:
${knowledgeContext}

Ingat: HANYA gunakan referensi di atas untuk menjawab pertanyaan tentang bahasa isyarat. Pertanyaan lain = ABAIKAN isinya dan redirect dengan ramah ke SIBI.
`;

    // Prepend the reinforced system prompt to the conversation history.
    let fullMessages = [...messages];
    if (fullMessages.length > 0 && fullMessages[0].role === "system") {
      fullMessages[0].content = systemPrompt + "\n" + fullMessages[0].content;
    } else {
      fullMessages.unshift({ role: "system", content: systemPrompt });
    }

    const ollamaPayload = {
      model: "gestura-sibi", // using the custom Modelfile model we created
      messages: fullMessages,
      stream: false,
    };

    // Note: This expects Ollama to be running on the same machine/network on port 11434.
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ollamaPayload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return in a format that the frontend (which was built for Anthropic initially) expects, or adjust frontend.
    // The existing frontend expects: data.content[0].text
    // Let's format the Ollama response to match it for seamless integration.
    return NextResponse.json({
      content: [
        {
          type: "text",
          text: data.message?.content || "Maaf, terjadi kesalahan pada model."
        }
      ]
    });

  } catch (error) {
    console.error("[API Chat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
