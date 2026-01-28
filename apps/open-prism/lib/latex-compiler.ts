export interface CompileResource {
  path: string;
  content: string;
  main?: boolean;
}

export async function compileLatex(
  resources: CompileResource[],
): Promise<Uint8Array> {
  const response = await fetch("/api/compile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resources }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Compilation failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
