import path from 'node:path';
import { ApiError } from '../../utils/api-error.js';

const MIME_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export function validateFile(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!MIME_EXTENSIONS[file.mimetype]?.includes(extension))
    throw new ApiError(415, 'File type is not allowed');
  const bytes = file.buffer;
  const validSignature =
    file.mimetype === 'application/pdf'
      ? bytes.subarray(0, 5).toString() === '%PDF-'
      : file.mimetype === 'image/png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : file.mimetype === 'image/jpeg'
          ? bytes[0] === 0xff && bytes[1] === 0xd8
          : true;
  if (!validSignature) throw new ApiError(415, 'File contents do not match the declared type');
  return extension;
}
