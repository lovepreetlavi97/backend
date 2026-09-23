export interface AppEnvConfig {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    redisHost: string;
    redisPort: number;
    jwtSecret: string;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    awsBucket: string;
    awsRegion: string;
    allowedOrigins: string[];
}
export declare const getEnvConfig: () => AppEnvConfig;
