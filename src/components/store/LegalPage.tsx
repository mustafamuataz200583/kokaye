export function LegalPage({ title, body, updatedAt }: { title: string; body: string; updatedAt?: string }) {
  const blocks = body.split(/\n{2,}/);
  return (
    <div className="container-k max-w-3xl pt-28 pb-24 md:pt-36">
      <p className="eyebrow">كوكاية</p>
      <h1 className="mt-4 text-4xl md:text-5xl">{title}</h1>
      {updatedAt && <p className="mt-3 text-sm text-muted">آخر تحديث: {updatedAt}</p>}
      <div className="mt-10 grid gap-6 text-[1.0625rem] leading-loose text-cocoa/85">
        {blocks.map((b, i) => {
          const [first, ...rest] = b.split("\n");
          const isHeading = rest.length > 0 && first.length < 40 && !first.startsWith("•");
          return (
            <div key={i}>
              {isHeading ? <h2 className="mb-2 text-xl">{first}</h2> : <p className="whitespace-pre-line">{first}</p>}
              {rest.length > 0 && <p className="whitespace-pre-line">{rest.join("\n")}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
