export default function MoneyCenterIllustration() {
  return (
    <div className="relative h-32 w-32">
      {/* Wallet */}
      <div
        className="
          absolute
          bottom-3
          left-4
          h-20
          w-28
          rounded-2xl
          bg-gradient-to-br
          from-emerald-400
          to-emerald-700
          shadow-xl
          rotate-[-8deg]
        "
      >
        <div className="absolute right-3 top-6 h-6 w-10 rounded-md bg-white/30" />
      </div>

      {/* Coin 1 */}
      <div
        className="
          absolute
          right-2
          top-3
          h-10
          w-10
          rounded-full
          bg-gradient-to-br
          from-yellow-300
          to-yellow-600
          shadow-lg
        "
      />

      {/* Coin 2 */}
      <div
        className="
          absolute
          right-10
          top-0
          h-6
          w-6
          rounded-full
          bg-gradient-to-br
          from-yellow-200
          to-yellow-500
          shadow
        "
      />

      {/* Growth line */}
      <div
        className="
          absolute
          bottom-0
          right-0
          h-1
          w-20
          rounded-full
          bg-gradient-to-r
          from-emerald-300
          to-blue-500
          rotate-[-20deg]
        "
      />
    </div>
  );
}
