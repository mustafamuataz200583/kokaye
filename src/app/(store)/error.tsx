"use client";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-k flex min-h-[60vh] flex-col items-center justify-center pt-28 text-center">
      <h1 className="text-3xl">صار خلل بسيط</h1>
      <p className="mt-3 max-w-md text-muted">ما قدرنا نحمل الصفحة هسه. حاول مرة ثانية بعد لحظات.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">حاول مرة ثانية</button>
    </div>
  );
}
