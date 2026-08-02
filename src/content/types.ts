export interface TextRun {
  text: string;
  emphasis?: 'strong' | 'em';
}

export type RichText = readonly TextRun[];
