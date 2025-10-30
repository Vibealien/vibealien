

export interface Services {
    basePath:string;
    serviceName: string;
    serviceUrl: string;
    wsUrl?: string;
    healthRoute?: string;
    routesRequiringAuth?: {
        route: string;
        methods?: string[];
        roles?: string[];
    }[];
}

export interface AuthConfig{
    validationPath: string;
    url: string;
    timeout: number;
}
