export default function AboutPage() {
  return (
    <div className="container max-w-screen-2xl">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-h1">About Us</h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Information about the Think Then Talk community.
          </p>
        </div>
      </section>
    </div>
  );
}
