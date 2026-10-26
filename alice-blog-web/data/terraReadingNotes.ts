export type TerraReadingNote = { scenario: string; researchQuestion: string; boundary: string; reference?: { label: string; url: string } };
export const terraReadingNotes: Record<string, TerraReadingNote> = {};
