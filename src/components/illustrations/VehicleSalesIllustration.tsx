export default function VehicleSalesIllustration() {
  return (
    <div className="relative h-32 w-32">
      {/* Car body */}
      <div className="absolute bottom-8 left-2 h-12 w-28 rounded-xl bg-blue-600 shadow-lg">
        {/* Front windshield */}
        <div className="absolute left-5 top-2 h-6 w-8 rounded-md bg-blue-200" />

        {/* Back windshield */}
        <div className="absolute right-5 top-2 h-6 w-8 rounded-md bg-blue-200" />

        {/* Door line */}
        <div className="absolute left-1/2 top-6 h-5 w-px bg-blue-900" />
      </div>

      {/* Front wheel */}
      <div className="absolute bottom-3 left-6 h-7 w-7 rounded-full border-4 border-gray-400 bg-gray-900" />

      {/* Back wheel */}
      <div className="absolute bottom-3 right-6 h-7 w-7 rounded-full border-4 border-gray-400 bg-gray-900" />

      {/* Headlight */}
      <div className="absolute bottom-12 left-2 h-3 w-3 rounded-full bg-yellow-300" />

      {/* Money badge */}
      <div className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white shadow">
        $
      </div>
    </div>
  );
}
