import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 mb-4">
        <span className="text-2xl font-bold">404</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-neutral-600 max-w-md">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="default">Return Home</Button>
        </Link>
      </div>
    </Container>
  );
}
