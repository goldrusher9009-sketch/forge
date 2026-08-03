import { Express } from 'express';
type Deps = {
    requireAuth: any;
    getUserLLMKey: (userId: string) => {
        provider: string;
        apiKey: string;
        model: string;
    };
    callLLM: (provider: string, apiKey: string, model: string, messages: any[], language?: string) => Promise<{
        content: string;
        promptTokens: number;
        completionTokens: number;
    }>;
    uuidv4: () => string;
};
export declare const FORGE_PLANS: Record<string, any>;
export declare const BUSINESS_TEMPLATES: Record<string, {
    label: string;
    persona: string;
    agents: {
        name: string;
        icon: string;
        color: string;
        prompt: string;
    }[];
}>;
export declare const AGENT_ROSTER: {
    id: string;
    name: string;
    group: string;
    icon: string;
    color: string;
    prompt: string;
}[];
export declare const AGENT_MODES: ({
    id: string;
    name: string;
    desc: string;
    system?: undefined;
} | {
    id: string;
    name: string;
    desc: string;
    system: string;
})[];
export declare function setupAutonomy(app: Express, db: any, deps: Deps): void;
export {};
//# sourceMappingURL=autonomy.d.ts.map