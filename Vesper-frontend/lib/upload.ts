import { API_BASE_URL, type ApiResult } from './api';
import { getAuthToken, handleUnauthorized } from './authSession';

type UploadVO = {
  url: string;
};

export type UploadImageInput = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

function getFilename(image: UploadImageInput) {
  if (image.name) {
    return image.name;
  }

  const uriName = image.uri.split('/').pop();
  return uriName || `review-${Date.now()}.jpg`;
}

function getContentType(filename: string, type?: string | null) {
  if (type) {
    return type;
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'png') {
    return 'image/png';
  }
  if (extension === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function readResult<T>(response: Response): Promise<ApiResult<T> | null> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return null;
  }
}

export function resolveAssetUrl(url: string) {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function uploadImage(image: UploadImageInput) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Please log in to continue.');
  }

  const filename = getFilename(image);
  const formData = new FormData();
  formData.append('file', {
    uri: image.uri,
    name: filename,
    type: getContentType(filename, image.type),
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await readResult<UploadVO>(response);
  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error(result?.message || 'Unable to upload image.');
  }

  if (!result || result.code !== 200) {
    if (result?.code === 401) {
      handleUnauthorized();
    }
    throw new Error(result?.message || 'Unable to upload image.');
  }

  return result.data.url;
}
