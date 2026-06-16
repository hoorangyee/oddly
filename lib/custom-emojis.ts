export const CUSTOM_EMOJI_MAX_BYTES = 1024 * 1024;

const ALLOWED_CONTENT_TYPES = {
  "image/gif": ["gif"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
} as const;

type AllowedContentType = keyof typeof ALLOWED_CONTENT_TYPES;

export type CustomEmojiUploadFile = {
  name: string;
  type: string;
  size: number;
};

export type ValidatedCustomEmojiUpload = {
  extension: string;
  contentType: AllowedContentType;
};

export function normalizeCustomEmojiShortcode(input: string): string {
  const raw = input.trim();
  const withoutColons = raw.startsWith(":") && raw.endsWith(":") ? raw.slice(1, -1) : raw;
  const name = withoutColons.trim().toLowerCase();

  if (!name) {
    throw new Error("이모지 이름을 입력하세요");
  }

  if (name.length > 40) {
    throw new Error("이모지 이름은 40자 이하로 입력하세요");
  }

  if (!/^[\p{L}\p{N}_+-]+$/u.test(name)) {
    throw new Error("이모지 이름은 문자, 숫자, -, _, +만 사용할 수 있습니다");
  }

  return `:${name}:`;
}

export function shortcodeToEmojiId(shortcode: string): string {
  return normalizeCustomEmojiShortcode(shortcode).slice(1, -1);
}

export function validateCustomEmojiUpload(
  file: CustomEmojiUploadFile,
): ValidatedCustomEmojiUpload {
  if (file.size <= 0) {
    throw new Error("업로드할 이미지 파일을 선택하세요");
  }

  if (file.size > CUSTOM_EMOJI_MAX_BYTES) {
    throw new Error("커스텀 이모지는 1MB 이하 파일만 업로드할 수 있습니다");
  }

  if (!isAllowedContentType(file.type)) {
    throw new Error("커스텀 이모지는 png, jpg, webp, gif 파일만 사용할 수 있습니다");
  }

  const extension = getFileExtension(file.name);
  const allowedExtensions = ALLOWED_CONTENT_TYPES[file.type];
  if (!allowedExtensions.includes(extension as never)) {
    throw new Error("커스텀 이모지는 png, jpg, webp, gif 파일만 사용할 수 있습니다");
  }

  return { extension, contentType: file.type };
}

export function canDeleteCustomEmoji(
  emoji: { creatorId: string },
  requesterMemberId: string,
  requesterIsAdmin: boolean,
): boolean {
  return requesterIsAdmin || emoji.creatorId === requesterMemberId;
}

function isAllowedContentType(type: string): type is AllowedContentType {
  return type in ALLOWED_CONTENT_TYPES;
}

function getFileExtension(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  return extension && extension !== name.toLowerCase() ? extension : "";
}
