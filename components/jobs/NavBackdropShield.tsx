/** Blocks scroll content from showing through gaps around the floating pill navbar. */
export default function NavBackdropShield() {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[88px] bg-mist" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-x-0 top-[88px] z-40 h-8 bg-gradient-to-b from-mist to-transparent"
        aria-hidden="true"
      />
    </>
  );
}
