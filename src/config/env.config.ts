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

export const getEnvConfig = (): AppEnvConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  const customOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...customOrigins]));

  return {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv,
    databaseUrl: process.env.DATABASE_URL || 'postgresql://myg_admin:123456@localhost:5432/mygold_db?schema=public',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    jwtSecret: process.env.JWT_SECRET_KEY || '05642a6a1506152d1db641f3089a5e315f591340f5b6ba6af1ce265a20403b4e6094a60f0925e8caf96f13018bfd85c021206377d56a0e6fc5afa',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_Ra1vXi1KrttmCm',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'mZE9d7d71NKu3Mlt4JzSea59',
    awsBucket: process.env.AWS_S3_BUCKET || 'xpernex-storage',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    allowedOrigins,
  };
};

