import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type === 'application/pdf') {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      if (!data.text.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from PDF. It may be a scanned image. Please paste your resume as text.' },
          { status: 422 }
        );
      }
      return NextResponse.json({ text: data.text });
    }

    const text = await file.text();
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
