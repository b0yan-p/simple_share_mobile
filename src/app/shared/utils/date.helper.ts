export class DateHelper {
  // date = '2026-01-17T19:22:00'
  static extractDateOnly(date: string): string {
    return date.split('T')[0];
  }

  //   date = '2026-01-17T19:22:00'
  static extractYearAndMonth(date: string): string {
    return date.substring(0, 7);
  }
}
