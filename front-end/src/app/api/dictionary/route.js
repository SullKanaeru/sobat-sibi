// src/app/api/dictionary/route.js
import { NextResponse } from "next/server";
import prisma from "@/server/db";

// GET all dictionary entries
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dict_type = searchParams.get("dict_type");
    const search = searchParams.get("search");

    const where = {};

    if (dict_type) {
      where.dict_type = dict_type;
    }

    if (search) {
      where.OR = [
        { text: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.dictionary.findMany({
      where,
      orderBy: {
        text: "asc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching dictionary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST new dictionary entry
export async function POST(request) {
  try {
    const body = await request.json();
    const { text, dict_type, image_url, video_url, description } = body;

    const entry = await prisma.dictionary.create({
      data: {
        text,
        dict_type,
        image_url,
        video_url,
        description,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating dictionary entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
