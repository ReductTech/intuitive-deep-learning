export interface EndpointConfig { baseUrl: string; apiKey: string; model: string }
export interface InterfaceConfig { llm: EndpointConfig; image: EndpointConfig }
export interface PublicConfig {
  path: string;
  llm: Omit<EndpointConfig, 'apiKey'> & { configured: boolean };
  image: Omit<EndpointConfig, 'apiKey'> & { configured: boolean };
}
export interface Slide {
  id: string; title: string; prompt: string; image?: string; source?: string; references?: string[];
}
export interface Project { id: string; title: string; slides: Slide[]; updatedAt: string }
export interface Selection { tag: string; text: string; html: string; selector: string }
