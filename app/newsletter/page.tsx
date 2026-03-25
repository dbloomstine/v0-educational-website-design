import { redirect } from 'next/navigation'

// Old newsletter listing page — redirect to FundOps Daily on /news
export default function NewsletterPage() {
  redirect('/news')
}
