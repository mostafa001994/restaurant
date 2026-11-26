import AuthForm from '@/components/AuthForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main><AuthForm initialMode="otp" next={next} /></main>;
}
