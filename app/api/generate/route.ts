import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

let frauncesBoldData: Buffer | null = null;
let dmSansRegularData: Buffer | null = null;

async function loadFonts() {
  if (!frauncesBoldData) {
    frauncesBoldData = await fs.readFile(path.join(process.cwd(), 'public/fonts/Fraunces-Bold.ttf'));
  }
  if (!dmSansRegularData) {
    dmSansRegularData = await fs.readFile(path.join(process.cwd(), 'public/fonts/DMSans-Regular.ttf'));
  }
}

function splitIntoChunks(text: string, wordsPerChunk = 500): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let wordCount = 0;

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).length;
    if (wordCount + words > wordsPerChunk && current.length > 0) {
      chunks.push(current.join('\n\n'));
      current = [para];
      wordCount = words;
    } else {
      current.push(para);
      wordCount += words;
    }
  }
  if (current.length > 0) chunks.push(current.join('\n\n'));
  return chunks;
}

function renderCard(
  title: string,
  content: string,
  logo: string | undefined,
  pageIndex: number,
  totalPages: number
) {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '2100px',
        height: '2800px',
        backgroundColor: '#3D4455',
        padding: '120px',
        fontFamily: 'DM Sans',
      },
    },
    // Logo
    logo
      ? React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '50px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              marginBottom: '40px',
            },
          },
          React.createElement('img', {
            src: logo,
            width: 80,
            height: 80,
            style: {
              borderRadius: '40px',
              objectFit: 'cover',
            },
          })
        )
      : null,
    // Title
    React.createElement(
      'div',
      {
        style: {
          fontFamily: 'Fraunces',
          fontWeight: 700,
          fontSize: '96px',
          color: '#FFFFFF',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          marginBottom: '60px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        },
      },
      title
    ),
    // Content
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          fontFamily: 'DM Sans',
          fontWeight: 400,
          fontSize: '56px',
          color: 'rgba(255,255,255,0.82)',
          lineHeight: 1.65,
          overflow: 'hidden',
        },
      },
      content
    ),
    // Bottom row
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '40px',
        },
      },
      // Author pill
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '100px',
            padding: '12px 28px',
            gap: '14px',
          },
        },
        React.createElement('div', {
          style: {
            width: '16px',
            height: '16px',
            borderRadius: '8px',
            backgroundColor: '#E86830',
          },
        }),
        React.createElement(
          'span',
          {
            style: {
              fontFamily: 'DM Sans',
              fontSize: '40px',
              color: 'rgba(255,255,255,0.7)',
            },
          },
          'AudioPen'
        )
      ),
      // Page indicator
      totalPages > 1
        ? React.createElement(
            'span',
            {
              style: {
                fontFamily: 'DM Sans',
                fontSize: '40px',
                color: 'rgba(255,255,255,0.45)',
              },
            },
            `${pageIndex + 1} / ${totalPages}`
          )
        : null
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, logo } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    await loadFonts();

    const chunks = splitIntoChunks(content);
    const totalPages = chunks.length;
    const imageUrls: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const element = renderCard(title, chunks[i], logo, i, totalPages);

      const svg = await satori(element, {
        width: 2100,
        height: 2800,
        fonts: [
          { name: 'Fraunces', data: new Uint8Array(frauncesBoldData!).buffer, weight: 700, style: 'normal' as const },
          { name: 'DM Sans', data: new Uint8Array(dmSansRegularData!).buffer, weight: 400, style: 'normal' as const },
        ],
      });

      const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

      const blob = await put(
        'imprint/' + Date.now() + '-' + i + '.png',
        pngBuffer,
        { access: 'public', contentType: 'image/png' }
      );

      imageUrls.push(blob.url);
    }

    return NextResponse.json({ images: imageUrls });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}
