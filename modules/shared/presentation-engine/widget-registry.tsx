import { createContext, useContext, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import type { WidgetInstance } from './document';

export interface NarrationAnchor {
  id: string;
  label: string;
}

export interface WidgetRuntimeProps<Props = Record<string, unknown>, State = unknown> {
  instanceId: string;
  mode: 'edit' | 'present' | 'guide';
  props: Props;
  state: State | undefined;
  setState: (state: State) => void;
  activeAnchorId?: string;
}

export interface WidgetDefinition<Props = Record<string, unknown>, State = unknown> {
  type: string;
  version: number;
  displayName: string;
  Component: ComponentType<WidgetRuntimeProps<Props, State>>;
  capabilities: {
    interactive: boolean;
    resizable: boolean;
    serializable: boolean;
    supportsSlide: boolean;
    supportsGuide: boolean;
    supportsNarration: boolean;
  };
  narrationAnchors?: NarrationAnchor[];
  migrate?: (oldVersion: number, props: unknown) => Props;
}

export class WidgetRegistry {
  private readonly definitions = new Map<string, WidgetDefinition<any, any>>();

  register<Props, State>(definition: WidgetDefinition<Props, State>): this {
    const current = this.definitions.get(definition.type);
    if (current && current.version !== definition.version) {
      throw new Error(`Widget "${definition.type}" is already registered at version ${current.version}`);
    }
    this.definitions.set(definition.type, definition as WidgetDefinition<any, any>);
    return this;
  }

  get(type: string): WidgetDefinition<any, any> | undefined {
    return this.definitions.get(type);
  }

  list(): WidgetDefinition<any, any>[] {
    return [...this.definitions.values()];
  }
}

const RegistryContext = createContext<WidgetRegistry | null>(null);
const WidgetSessionContext = createContext<{
  states: Record<string, unknown>;
  setWidgetState: (id: string, state: unknown) => void;
} | null>(null);

export function WidgetRegistryProvider({ registry, children }: { registry: WidgetRegistry; children: ReactNode }) {
  const [states, setStates] = useState<Record<string, unknown>>({});
  const session = useMemo(() => ({
    states,
    setWidgetState: (id: string, state: unknown) => setStates((current) => ({ ...current, [id]: state })),
  }), [states]);
  return <RegistryContext.Provider value={registry}>
    <WidgetSessionContext.Provider value={session}>{children}</WidgetSessionContext.Provider>
  </RegistryContext.Provider>;
}

export function useWidgetRegistry(): WidgetRegistry {
  const registry = useContext(RegistryContext);
  if (!registry) throw new Error('WidgetRegistryProvider is missing');
  return registry;
}

export function WidgetRenderer({ instance, mode, activeAnchorId, onStateChange }: {
  instance: WidgetInstance;
  mode: WidgetRuntimeProps['mode'];
  activeAnchorId?: string;
  onStateChange?: (state: unknown) => void;
}) {
  const registry = useWidgetRegistry();
  const session = useContext(WidgetSessionContext);
  const definition = registry.get(instance.widgetType);
  const [fallbackState, setFallbackState] = useState(instance.state);
  const runtimeState = Object.prototype.hasOwnProperty.call(session?.states ?? {}, instance.id)
    ? session?.states[instance.id]
    : fallbackState;
  const props = useMemo(() => {
    if (!definition || instance.widgetVersion === definition.version) return instance.props;
    return definition.migrate?.(instance.widgetVersion, instance.props) ?? instance.props;
  }, [definition, instance.props, instance.widgetVersion]);

  if (!definition) {
    return <div className="pe-widget-missing">未注册组件<br /><code>{instance.widgetType}</code></div>;
  }

  const Component = definition.Component;
  return <Component
    instanceId={instance.id}
    mode={mode}
    props={props}
    state={runtimeState}
    activeAnchorId={activeAnchorId}
    setState={(nextState: unknown) => {
      setFallbackState(nextState);
      session?.setWidgetState(instance.id, nextState);
      onStateChange?.(nextState);
    }}
  />;
}
