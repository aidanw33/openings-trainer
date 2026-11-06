export interface Line {
  id: string;
  name: string;
  /** Mini-PGN: SAN moves, optional move numbers, {comment} after a move explains it. */
  pgn: string;
}

export interface Chapter {
  id: string;
  name: string;
  /** Big-picture plans and motifs for this variation. */
  ideas: string[];
  lines: Line[];
}

export interface Opening {
  id: string;
  name: string;
  side: 'white' | 'black';
  summary: string;
  chapters: Chapter[];
}
