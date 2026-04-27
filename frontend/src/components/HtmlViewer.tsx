interface Props {
  projectName: string;
  filename: string;
  cacheBust?: string | number;
}

export default function HtmlViewer({ projectName, filename, cacheBust }: Props) {
  const base = `/api/projects/${encodeURIComponent(projectName)}/documents/${encodeURIComponent(filename)}`;
  const url = cacheBust ? `${base}?t=${encodeURIComponent(String(cacheBust))}` : base;

  return (
    <iframe
      src={url}
      title={filename}
      className="w-full h-full bg-white border-0"
      sandbox="allow-scripts allow-popups allow-forms"
    />
  );
}
