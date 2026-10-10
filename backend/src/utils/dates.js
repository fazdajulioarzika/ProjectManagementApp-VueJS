// Awal hari ini (UTC). Task yang jatuh tempo hari ini belum dianggap terlambat.
export const startOfTodayUTC = () =>
  new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
