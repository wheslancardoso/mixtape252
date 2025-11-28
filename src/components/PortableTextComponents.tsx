import React from 'react';
import { urlFor } from '../lib/sanity';

export const SanityImage = ({ value }: any) => {
    if (!value?.asset?._ref) {
        return null;
    }

    return (
        <figure className="relative w-auto max-w-full mx-auto my-12 block">
            <div className="relative inline-block">
                <img
                    src={urlFor(value).width(1200).fit('max').auto('format').url()}
                    alt={value.alt || 'Post image'}
                    className="h-auto max-h-[70vh] border-4 border-ink shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform duration-300 contrast-125"
                />
                {/* Noise Overlay */}
                <div
                    className="absolute inset-0 mix-blend-overlay opacity-40 pointer-events-none"
                    style={{ backgroundImage: "url('/overlay.png')", backgroundSize: 'cover' }}
                />
            </div>
            {value.caption && (
                <figcaption className="font-mono text-xs mt-3 p-1 bg-ink text-paper inline-block transform -rotate-1">
                    {value.caption}
                </figcaption>
            )}
        </figure>
    );
};

export const H2 = ({ children }: any) => (
    <h2 className="text-3xl md:text-4xl font-headline uppercase font-bold mt-12 mb-6 border-b-4 border-ink inline-block pr-8">
        {children}
    </h2>
);

export const H3 = ({ children }: any) => (
    <h3 className="text-2xl md:text-3xl font-headline uppercase font-bold mt-8 mb-4">
        {children}
    </h3>
);

export const BulletList = ({ children }: any) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 marker:text-safety-orange">
        {children}
    </ul>
);

export const NumberList = ({ children }: any) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 marker:text-ink font-bold">
        {children}
    </ol>
);
