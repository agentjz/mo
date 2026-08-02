import { Fragment } from 'react';
import type { RichText as RichTextContent } from '../content/types.ts';

interface RichTextProps {
  content: RichTextContent;
}

export default function RichText({ content }: RichTextProps): JSX.Element {
  return (
    <>
      {content.map((run, index) => {
        if (run.emphasis === 'strong') return <strong key={index}>{run.text}</strong>;
        if (run.emphasis === 'em') return <em key={index}>{run.text}</em>;
        return <Fragment key={index}>{run.text}</Fragment>;
      })}
    </>
  );
}
