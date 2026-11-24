import AuthForm from '@/components/AuthForm';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main><AuthForm initialMode="register" next={next} /></main>;
}
