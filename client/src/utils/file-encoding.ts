type ReadableFile = Pick<File, 'arrayBuffer'>;

/**
 * 读取客户提供的文本表格。浏览器的 File.text() 固定按 UTF-8 解码，
 * 但 Windows 版 Excel 导出的中文 CSV 经常是 GB18030/GBK，因此需要显式回退。
 */
export async function decodeTextFile(file: ReadableFile): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    try {
      return new TextDecoder('gb18030', { fatal: true }).decode(bytes);
    } catch {
      throw new Error('文件文字编码无法识别，请另存为 UTF-8、GBK 或 Unicode 后重试');
    }
  }
}
