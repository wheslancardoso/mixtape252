import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { sanityClient, urlFor } from '../../lib/sanity';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Slug is required', { status: 400 });
    }

    // Buscar post no Sanity
    const post = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0]{
        title,
        mainImage
      }`,
      { slug }
    );

    if (!post) {
      return new Response('Post not found', { status: 404 });
    }

    // Carregar fonte Anton do Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K08i4gS7lu.woff2';
    const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());

    // Background image URL (se existir)
    const bgImageUrl = post.mainImage 
      ? urlFor(post.mainImage).width(1080).height(1080).url()
      : null;

    // Gerar SVG com Satori
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f4f1ea',
            position: 'relative',
            overflow: 'hidden',
          },
          children: [
            // Background Image (grayscale) - usando div com background-image
            bgImageUrl && {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${bgImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(100%)',
                  opacity: 0.3,
                },
              },
            },
            // Noise Overlay
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  opacity: 0.15,
                },
              },
            },
            // Content Container
            {
              type: 'div',
              props: {
                style: {
                  position: 'relative',
                  zIndex: 10,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '80px',
                  textAlign: 'center',
                },
                children: [
                  // Title
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '72px',
                        fontWeight: 900,
                        fontFamily: 'Anton',
                        textTransform: 'uppercase',
                        color: '#111111',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
                        maxWidth: '900px',
                      },
                      children: post.title,
                    },
                  },
                  // Brand Badge
                  {
                    type: 'div',
                    props: {
                      style: {
                        marginTop: '40px',
                        padding: '12px 24px',
                        backgroundColor: '#ff4d00',
                        color: '#ffffff',
                        fontSize: '24px',
                        fontFamily: 'Anton',
                        textTransform: 'uppercase',
                        border: '4px solid #111111',
                        boxShadow: '6px 6px 0px 0px #111111',
                      },
                      children: 'MIXTAPE252',
                    },
                  },
                ],
              },
            },
          ].filter(Boolean),
        },
      },
      {
        width: 1080,
        height: 1080,
        fonts: [
          {
            name: 'Anton',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    // Converter SVG para PNG
    const resvg = new Resvg(svg, {
      background: '#f4f1ea',
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Retornar PNG com cache agressivo
    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
