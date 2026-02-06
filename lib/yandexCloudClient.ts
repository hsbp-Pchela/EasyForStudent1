import { S3 } from '@aws-sdk/client-s3';

const s3Client = new S3({
  region: process.env.YANDEX_CLOUD_REGION || 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YANDEX_CLOUD_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YANDEX_CLOUD_SECRET_ACCESS_KEY!,
  },
});

export { s3Client };