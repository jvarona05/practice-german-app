import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = parseInt(size, 10) || 192;
  const fontSize = Math.round(px * 0.45);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          background: '#4f6ef7',
          borderRadius: px * 0.22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize, fontWeight: 700, letterSpacing: '-2px' }}>
          De
        </span>
      </div>
    ),
    { width: px, height: px },
  );
}
