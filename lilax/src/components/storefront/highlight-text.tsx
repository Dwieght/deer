export default function HighlightText({
  text,
  query
}: {
  text: string;
  query: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmed.length);
  const after = text.slice(index + trimmed.length);

  return (
    <>
      {before}
      <mark className="rounded bg-amber-200/80 px-1 text-inherit">{match}</mark>
      {after}
    </>
  );
}
