import { z } from 'zod';
import type { PresentationStore } from './store';

export const presentationCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('select'), placementIds: z.array(z.string()) }),
  z.object({
    type: z.literal('update-placement'),
    placementId: z.string(),
    patch: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      rotation: z.number().optional(),
      hidden: z.boolean().optional(),
      locked: z.boolean().optional(),
      zIndex: z.number().int().optional(),
    }),
  }),
  z.object({ type: z.literal('reorder'), placementId: z.string(), direction: z.enum(['front', 'back']) }),
  z.object({ type: z.literal('open-slide'), slideId: z.string() }),
  z.object({ type: z.literal('set-mode'), mode: z.enum(['edit', 'present', 'guide']) }),
  z.object({ type: z.literal('highlight'), targetId: z.string().optional() }),
  z.object({ type: z.literal('undo') }),
  z.object({ type: z.literal('redo') }),
]);

export type PresentationCommand = z.infer<typeof presentationCommandSchema>;

export interface CommandResult {
  ok: boolean;
  message: string;
}

export function executePresentationCommand(store: PresentationStore, input: unknown): CommandResult {
  const parsed = presentationCommandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: z.prettifyError(parsed.error) };
  const command = parsed.data;
  const state = store.getState();

  switch (command.type) {
    case 'select':
      state.selectPlacements(command.placementIds);
      return { ok: true, message: `Selected ${command.placementIds.length} placement(s)` };
    case 'update-placement':
      state.updatePlacements([{ id: command.placementId, patch: command.patch }]);
      return { ok: true, message: `Updated ${command.placementId}` };
    case 'reorder':
      state.reorderPlacement(command.placementId, command.direction);
      return { ok: true, message: `Moved ${command.placementId} ${command.direction}` };
    case 'open-slide':
      state.setActiveSlide(command.slideId);
      return { ok: true, message: `Opened ${command.slideId}` };
    case 'set-mode':
      state.setMode(command.mode);
      return { ok: true, message: `Mode is now ${command.mode}` };
    case 'highlight':
      state.setNarrationTarget(command.targetId);
      return { ok: true, message: command.targetId ? `Highlighted ${command.targetId}` : 'Highlight cleared' };
    case 'undo':
      state.undo();
      return { ok: true, message: 'Undo complete' };
    case 'redo':
      state.redo();
      return { ok: true, message: 'Redo complete' };
  }
}

