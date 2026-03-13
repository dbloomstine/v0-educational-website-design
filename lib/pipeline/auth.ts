/**
 * Pipeline route authentication.
 *
 * Accepts either:
 * - Vercel Cron: Authorization: Bearer <CRON_SECRET>
 * - Manual trigger: x-api-key: <PIPELINE_API_KEY>
 */

export function isAuthorizedPipelineRequest(req: Request): boolean {
  const cronSecret = req.headers.get('authorization');
  const apiKey = req.headers.get('x-api-key');

  return (
    (!!process.env.CRON_SECRET && cronSecret === `Bearer ${process.env.CRON_SECRET}`) ||
    (!!process.env.PIPELINE_API_KEY && apiKey === process.env.PIPELINE_API_KEY)
  );
}
