import React from 'react';

const Blockquote = ({ children }: any) => (
    <blockquote className="bg-ink text-safety-orange border-4 border-ink p-6 font-headline text-2xl md:text-3xl uppercase leading-tight my-8 shadow-hard transform -rotate-1">
        {children}
    </blockquote>
);

export default Blockquote;
