

---

## 第53章 文件存储与上传系统

### 53.1 概述

系统使用 dataloom storage 实现文件上传、下载、列表查询和分享链接生成。文件存储为云存储，前端通过 SDK 直接操作。

#### 核心能力

| 能力 | API | 说明 |
|------|-----|------|
| 文件上传 | `uploadFile` | 上传到默认 bucket |
| 文件删除 | `remove` | 按 filePath 删除 |
| 文件列表 | `list` | 列出 bucket 中的文件 |
| 获取下载URL | `generateDownloadUrlFromFilePath` | filePath → 可访问 URL |
| 获取 bucket | `getDefaultBucketId` | 获取默认 bucket ID |

### 53.2 前端文件上传

#### 基础上传

```typescript
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';

async function uploadImage(file: File): Promise<string> {
  const dataloom = getDataloom();
  const bucketId = await dataloom.getDefaultBucketId();

  const result = await dataloom.uploadFile({
    bucketId,
    file,
    filePath: `inbound-photos/${Date.now()}-${file.name}`,
  });

  // result.file_path 是文件的唯一标识
  // 需要展示时调用 generateDownloadUrlFromFilePath
  return result.file_path;
}
```

#### 批量上传

```typescript
async function uploadMultipleFiles(files: File[]): Promise<string[]> {
  const dataloom = getDataloom();
  const bucketId = await dataloom.getDefaultBucketId();

  const uploadPromises = files.map((file, index) =>
    dataloom.uploadFile({
      bucketId,
      file,
      filePath: `batch-upload/${Date.now()}-${index}-${file.name}`,
    })
  );

  const results = await Promise.all(uploadPromises);
  return results.map(r => r.file_path);
}
```

### 53.3 图片预览组件

```tsx
function StoredImage({ filePath, alt, className }: { filePath: string; alt?: string; className?: string }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!filePath) return;
    getDataloom().generateDownloadUrlFromFilePath(filePath)
      .then(setUrl)
      .catch(() => logger.error('Failed to load image:', filePath));
  }, [filePath]);

  if (!url) return <ImageSkeleton className={className} />;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = '/placeholder.png';
      }}
    />
  );
}
```

### 53.4 图片上传组件

```tsx
function ImageUploader({
  value,
  onChange,
  maxCount = 1,
  label = '上传图片',
}: {
  value: string | string[];
  onChange: (paths: string | string[]) => void;
  maxCount?: number;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const paths = Array.isArray(value) ? value : value ? [value] : [];

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const newPaths = await uploadMultipleFiles(Array.from(files));
      const updated = [...paths, ...newPaths].slice(0, maxCount);
      onChange(maxCount === 1 ? updated[0] : updated);
    } catch (err) {
      toast.error('上传失败');
      logger.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updated = paths.filter((_, i) => i !== index);
    onChange(maxCount === 1 ? updated[0] || '' : updated);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {paths.map((path, index) => (
          <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
            <StoredImage filePath={path} className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {paths.length < maxCount && (
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">上传</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple={maxCount > 1}
              className="hidden"
              onChange={(e) => e.target.files?.length && handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        支持 JPG、PNG，最多 {maxCount} 张
      </p>
    </div>
  );
}
```

### 53.5 Excel 文件上传

```tsx
function ExcelUploader({ onParsed, onError }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        onParsed(rows);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      onError('Excel 解析失败');
      logger.error('Excel parse error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.xlsx')) handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">解析中...</span>
        </div>
      ) : (
        <label className="cursor-pointer">
          <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">点击或拖拽 Excel 文件到此处</p>
          <p className="text-xs text-muted-foreground mt-1">支持 .xlsx 格式</p>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
```

### 53.6 服务端文件处理

服务端不支持文件上传（FaaS 限制），仅保存元信息。

```typescript
@Injectable()
export class FileMetaService {
  constructor(@Inject(DRIZZLE_DATABASE) private db: PostgresJsDatabase) {}

  async saveMeta(meta: {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    refId?: string;
  }) {
    const [record] = await this.db.insert(fileMetas).values({
      ...meta,
      uploadedAt: new Date(),
    }).returning();

    return record;
  }

  async getByRefId(refId: string, category: string) {
    return this.db.select().from(fileMetas)
      .where(and(
        eq(fileMetas.refId, refId),
        eq(fileMetas.category, category),
      ));
  }

  async delete(filePath: string) {
    await this.db.delete(fileMetas).where(eq(fileMetas.filePath, filePath));
  }
}
```

### 53.7 文件路径规范

```
inbound-photos/{timestamp}-{filename}      // 来货登记照片
outbound-photos/{timestamp}-{filename}     // 发货照片
excel-templates/{templateName}.xlsx       // Excel 模板
print-logs/{timestamp}-{type}.pdf          // 打印日志
```

### 53.8 文件大小限制

| 类型 | 最大大小 | 允许格式 |
|------|---------|---------|
| 图片 | 5 MB | JPG, PNG, GIF, WebP |
| Excel | 10 MB | XLSX, XLS |
| PDF | 20 MB | PDF |
| 普通 | 10 MB | 任意 |
