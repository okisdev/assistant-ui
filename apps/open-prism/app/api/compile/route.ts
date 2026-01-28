import { NextResponse } from "next/server";

export const maxDuration = 60;

interface CompileResource {
  path: string;
  content: string;
  main?: boolean;
}

export async function POST(req: Request) {
  try {
    const { resources } = (await req.json()) as {
      resources: CompileResource[];
    };

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { error: "No resources provided" },
        { status: 400 },
      );
    }

    const apiResources = resources.map((r) => ({
      path: r.path,
      content: r.content,
      main: r.main,
    }));

    const response = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: apiResources,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Compilation failed: ${errorText}` },
        { status: 500 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=document.pdf",
      },
    });
  } catch (error) {
    console.error("Compilation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown compilation error",
      },
      { status: 500 },
    );
  }
}
