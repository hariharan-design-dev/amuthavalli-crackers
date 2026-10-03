import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInvoiceByToken } from '@/lib/data/invoice';
import { InvoiceDocument } from '@/components/invoice/invoice-document';

interface InvoicePageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);

  if (!invoice) {
    return {
      title: 'Invoice Not Found | Amuthavalli Crackers',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `Invoice ${invoice.orderNumber} | Amuthavalli Crackers`,
    description: `Official Bill of Supply for Order ${invoice.orderNumber}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDocument invoice={invoice} />;
}
