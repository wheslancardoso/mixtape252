import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { sanityClient, urlFor } from "../../lib/sanity";
import type { APIRoute } from "astro";

export const prerender = false;

// Helper para buscar fonte
async function fetchFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype|woff)'\)/
  );
  if (!resource) throw new Error("Falha ao carregar fonte");
  return await fetch(resource[1]).then((res) => res.arrayBuffer());
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug");
    if (!slug) return new Response("Slug missing", { status: 400 });

    // Busca dados do Sanity
    const post = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0]{ title, mainImage, publishedAt }`,
      { slug }
    );

    if (!post) return new Response("Post not found", { status: 404 });

    const title = (post.title || "SEM TÍTULO").toUpperCase();
    const date = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("pt-BR")
      : "DATA DESCONHECIDA";
    const imageUrl = post.mainImage
      ? urlFor(post.mainImage).width(1200).height(1200).fit("crop").url()
      : null;

    // Carrega fonte Anton
    // Adicionamos caracteres extras para garantir que números e símbolos comuns estejam disponíveis
    const fontData = await fetchFont(
      "Anton",
      400,
      title + "MIXTAPE252" + date + "0123456789//"
    );

    // Gera SVG com Satori (Estilos Inline para segurança)
    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#111",
            position: "relative",
          },
          children: [
            // 1. Imagem de Fundo
            imageUrl
              ? {
                type: "img",
                props: {
                  src: imageUrl,
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "grayscale(100%) contrast(120%)", // Filtro CSS básico suportado
                  },
                },
              }
              : {
                // Fallback se não houver imagem
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#222",
                  },
                },
              },
            // 2. Overlay Escuro (Para leitura)
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0,0,0,0.4)", // Escurece a foto
                },
              },
            },
            // 3. Borda Laranja
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: "40px",
                  left: "40px",
                  right: "40px",
                  bottom: "40px",
                  border: "10px solid #ff4d00",
                  pointerEvents: "none",
                },
              },
            },
            // 4. Conteúdo de Texto
            {
              type: "div",
              props: {
                style: {
                  position: "relative",
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end", // Texto embaixo
                  padding: "80px",
                },
                children: [
                  // Data / Badge
                  {
                    type: "div",
                    props: {
                      children: `MIXTAPE252 // ${date}`,
                      style: {
                        color: "#ff4d00",
                        fontSize: "30px",
                        fontFamily: "Anton",
                        marginBottom: "20px",
                        backgroundColor: "black",
                        padding: "10px 20px",
                        alignSelf: "flex-start",
                      },
                    },
                  },
                  // Título Gigante
                  {
                    type: "div",
                    props: {
                      children: title,
                      style: {
                        color: "white",
                        fontSize: "140px", // Tamanho brutalista
                        fontFamily: "Anton",
                        lineHeight: "0.85",
                        textTransform: "uppercase",
                        textShadow: "5px 5px 0px #000", // Sombra dura
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      } as any, // Cast to any to avoid strict React type issues with Satori
      {
        width: 1080,
        height: 1080,
        fonts: [
          {
            name: "Anton",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );

    // Converte para PNG
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 1080,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer as any, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("OG Image Generation Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
};
