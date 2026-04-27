interface Props {
  projectName: string;
  filename: string;
  cacheBust?: string | number;
}

export default function ImageViewer({ projectName, filename, cacheBust }: Props) {
  const base = `/api/projects/${encodeURIComponent(projectName)}/documents/${encodeURIComponent(filename)}`;
  const url = cacheBust ? `${base}?t=${encodeURIComponent(String(cacheBust))}` : base;

  return (
    <div className="flex items-center justify-center h-full w-full p-8 bg-gray-50 overflow-auto">
      <img
        src={url}
        alt={filename}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
