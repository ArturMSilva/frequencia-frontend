interface Props {
  present: boolean;
  manual?: boolean;
}

export function Badge({ present, manual }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${present ? 'bg-green-500' : 'bg-red-400'}`}
      />
      {present ? 'Presente' : 'Ausente'}
      {manual && <span className="ml-1 text-gray-400">(manual)</span>}
    </span>
  );
}
