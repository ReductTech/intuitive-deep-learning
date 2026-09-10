import { z } from 'zod';

export const PRESENTATION_SCHEMA_VERSION = 1 as const;

const idSchema = z.string().min(1).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/);

export const sourceRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('content'), id: idSchema }),
  z.object({ kind: z.literal('widget'), id: idSchema }),
]);

export type SourceRef = z.infer<typeof sourceRefSchema>;

export const contentNodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: idSchema,
    type: z.literal('text'),
    role: z.enum(['eyebrow', 'title', 'subtitle', 'heading', 'body', 'question', 'note']),
    text: z.string(),
    ariaLabel: z.string().optional(),
  }),
  z.object({
    id: idSchema,
    type: z.literal('image'),
    assetId: idSchema,
    alt: z.string(),
    fit: z.enum(['contain', 'cover', 'fill']).default('cover'),
  }),
  z.object({
    id: idSchema,
    type: z.literal('shape'),
    shape: z.enum(['rectangle', 'ellipse', 'line']),
    label: z.string().optional(),
  }),
]);

export type ContentNode = z.infer<typeof contentNodeSchema>;

export const assetSchema = z.object({
  id: idSchema,
  type: z.enum(['image', 'video', 'audio', 'font', 'data']),
  src: z.string(),
  mimeType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type PresentationAsset = z.infer<typeof assetSchema>;

export const widgetInstanceSchema = z.object({
  id: idSchema,
  widgetType: idSchema,
  widgetVersion: z.number().int().positive(),
  props: z.record(z.string(), z.unknown()).default({}),
  state: z.unknown().optional(),
});

export type WidgetInstance = z.infer<typeof widgetInstanceSchema>;

export const placementStyleSchema = z.object({
  color: z.string().optional(),
  background: z.string().optional(),
  border: z.string().optional(),
  borderRadius: z.number().nonnegative().optional(),
  padding: z.number().nonnegative().optional(),
  boxShadow: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  overflow: z.enum(['visible', 'hidden', 'auto']).optional(),
});

export const slidePlacementSchema = z.object({
  id: idSchema,
  source: sourceRefSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  zIndex: z.number().int().default(0),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  style: placementStyleSchema.default({}),
});

export type SlidePlacement = z.infer<typeof slidePlacementSchema>;

export const slidePageSchema = z.object({
  id: idSchema,
  title: z.string(),
  width: z.number().positive().default(1600),
  height: z.number().positive().default(900),
  background: z.string().default('#ffffff'),
  placements: z.array(slidePlacementSchema),
});

export type SlidePage = z.infer<typeof slidePageSchema>;

export const guideSectionSchema = z.object({
  id: idSchema,
  title: z.string().optional(),
  layout: z.enum(['hero', 'flow', 'text-media', 'media-text', 'interactive', 'comparison']),
  sources: z.array(sourceRefSchema).min(1),
  theme: z.enum(['plain', 'paper', 'accent', 'dark']).default('plain'),
});

export type GuideSection = z.infer<typeof guideSectionSchema>;

export const narrationCueSchema = z.object({
  id: idSchema,
  at: z.number().nonnegative(),
  targetId: idSchema,
  action: z.enum(['highlight', 'spotlight', 'reveal', 'play', 'pause', 'execute-widget-action']),
  payload: z.record(z.string(), z.unknown()).optional(),
  duration: z.number().positive().default(2.4),
});

export type NarrationCue = z.infer<typeof narrationCueSchema>;

export const narrationSegmentSchema = z.object({
  id: idSchema,
  text: z.string().min(1),
  audioAssetId: idSchema.optional(),
  duration: z.number().positive(),
  cues: z.array(narrationCueSchema),
});

export type NarrationSegment = z.infer<typeof narrationSegmentSchema>;

export const presentationDocumentSchema = z.object({
  schemaVersion: z.literal(PRESENTATION_SCHEMA_VERSION),
  id: idSchema,
  title: z.string().min(1),
  content: z.record(idSchema, contentNodeSchema),
  assets: z.record(idSchema, assetSchema).default({}),
  widgets: z.record(idSchema, widgetInstanceSchema).default({}),
  views: z.object({
    slides: z.object({ pages: z.array(slidePageSchema).min(1) }),
    guide: z.object({ sections: z.array(guideSectionSchema).min(1) }),
  }),
  narration: z.object({ segments: z.array(narrationSegmentSchema) }).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type PresentationDocument = z.infer<typeof presentationDocumentSchema>;

export function parsePresentationDocument(input: unknown): PresentationDocument {
  const document = presentationDocumentSchema.parse(input);
  assertReferences(document);
  return document;
}

export function assertReferences(document: PresentationDocument): void {
  const assertSource = (source: SourceRef, owner: string) => {
    const exists = source.kind === 'content'
      ? Boolean(document.content[source.id])
      : Boolean(document.widgets[source.id]);
    if (!exists) throw new Error(`${owner} references missing ${source.kind} "${source.id}"`);
  };

  for (const page of document.views.slides.pages) {
    const placementIds = new Set<string>();
    for (const placement of page.placements) {
      if (placementIds.has(placement.id)) throw new Error(`Duplicate placement id "${placement.id}" on page "${page.id}"`);
      placementIds.add(placement.id);
      assertSource(placement.source, `Placement "${placement.id}"`);
      if (placement.x < 0 || placement.y < 0 || placement.x + placement.width > page.width || placement.y + placement.height > page.height) {
        throw new Error(`Placement "${placement.id}" escapes slide "${page.id}"`);
      }
    }
  }

  for (const section of document.views.guide.sections) {
    section.sources.forEach((source) => assertSource(source, `Guide section "${section.id}"`));
  }
}

export function clonePresentationDocument(document: PresentationDocument): PresentationDocument {
  return structuredClone(document);
}

