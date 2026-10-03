"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShoppingBag,
  Trash2,
  User,
  Phone,
  MapPin,
  Home,
  Lock,
  FileText,
  Coins,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import { useCart } from "@/context/cart-context";
import { getPublicProducts, type CustomerProductItem } from "@/lib/data/catalog";
import { submitGuestOrder } from "@/actions/order";

// Plain text validation: reject HTML/XML-like markup
const HTML_TAG_REGEX = /<\/?\s*[a-zA-Z][^>]*>|<![^>]*>|<\?[^>]*\?>/;

// Client-side checkout form schema
const CheckoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  deliveryAddress: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Must be a valid 6-digit Indian postal PIN code"),
  orderNotes: z
    .string()
    .trim()
    .max(1000, "Order notes cannot exceed 1,000 characters")
    .refine(
      (val) => !HTML_TAG_REGEX.test(val),
      "Order notes must be plain text and cannot contain HTML or markup tags"
    )
    .optional(),
});

type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalQuantity, setQuantity, removeItem, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [catalogMap, setCatalogMap] = useState<Record<string, CustomerProductItem>>({});

  // Form setup with React Hook Form and Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      deliveryAddress: "",
      city: "",
      pincode: "",
      orderNotes: "",
    },
  });

  // Load real catalog products to resolve cart items
  React.useEffect(() => {
    let isMounted = true;
    getPublicProducts()
      .then((products) => {
        if (!isMounted) return;
        const map: Record<string, CustomerProductItem> = {};
        for (const p of products) {
          map[p.id] = p;
        }
        setCatalogMap(map);
      })
      .catch((err) => {
        console.error("[Checkout] Failed to fetch catalog products:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve cart item references to full product details from the catalog
  const cartProductList = useMemo(() => {
    return Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity], index) => {
        const product = catalogMap[productId];
        const rate = product?.selling_rate ?? 0;
        return {
          index: index + 1,
          productId,
          quantity,
          name: product?.name || "Festive Cracker",
          rate,
          image: product?.image_url || "/images/products/gold_lakshmi.png",
          lineAmount: quantity * rate,
        };
      });
  }, [items, catalogMap]);

  // Derived displayed total amount (for immediate UI responsiveness)
  const calculatedTotalAmount = useMemo(() => {
    return cartProductList.reduce((sum, item) => sum + item.lineAmount, 0);
  }, [cartProductList]);

  // Handle direct numeric quantity input editing
  const handleQuantityInput = (productId: string, value: string) => {
    const parsed = parseInt(value, 10);
    const validQty = isNaN(parsed) || parsed < 0 ? 0 : Math.min(1000, parsed);
    setQuantity(productId, validQty);
  };

  // Form submission handler
  const onSubmit = async (values: CheckoutFormValues) => {
    if (cartProductList.length === 0) {
      setSubmissionError("Your cart is empty. Please add products before placing an order.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Generate client-side UUID idempotency key
      const idempotencyKey = crypto.randomUUID();

      const payload = {
        idempotencyKey,
        customer: {
          name: values.fullName,
          mobile: values.mobileNumber,
          address: values.deliveryAddress,
          city: values.city,
          pincode: values.pincode,
        },
        items: cartProductList.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        notes: values.orderNotes?.trim() || null,
      };

      const result = await submitGuestOrder(payload);

      if (result.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "amu_last_order",
            JSON.stringify({
              order: result.order,
              business: result.business,
            })
          );
        }
        clearCart();
        router.push("/order-success");
      } else {
        setSubmissionError(result.message || "Unable to place your order. Please try again.");
      }
    } catch (err) {
      console.error("[Checkout] Order placement error:", err);
      setSubmissionError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* 1. Desktop Navy Top Information Bar */}
      <TopInfoBar />

      {/* 2. Main Navigation Header */}
      <CustomerHeader
        totalItems={totalQuantity}
        totalAmount={calculatedTotalAmount}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {cartProductList.length === 0 ? (
          /* Empty Cart State */
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-8 sm:p-12 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-[#D62828] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Your Cart is Empty
            </h1>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              You haven&apos;t added any crackers to your cart yet. Explore our authentic Sivakasi collection to brighten your celebrations!
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#B71C1C] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors shadow-xs"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Main Checkout Experience: Selected Items + Customer Details */
          <div className="space-y-6 sm:space-y-8">
            {/* ========================================================== */}
            {/* SECTION 1: YOUR SELECTED ITEMS                             */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6 lg:p-7 transition-all">
              {/* Heading & Clear All */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center space-x-2.5">
                  <ShoppingBag className="w-5 h-5 text-[#D62828] shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    Your Selected Items ({totalQuantity} Items)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-[#D62828] hover:text-[#B71C1C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded px-1.5 py-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Desktop & Tablet Product Table */}
              <div className="hidden sm:block overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                      <th className="py-3 px-3 text-center w-12 text-neutral-400">#</th>
                      <th className="py-3 px-4 font-semibold text-neutral-700">Product</th>
                      <th className="py-3 px-4 font-semibold text-neutral-700 w-28">Rate</th>
                      <th className="py-3 px-4 font-semibold text-neutral-700 w-28 text-center">
                        Quantity
                      </th>
                      <th className="py-3 px-4 font-semibold text-neutral-700 w-28 text-right">
                        Amount
                      </th>
                      <th className="py-3 px-3 w-12 text-center" aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
                    {cartProductList.map((item) => (
                      <tr key={item.productId} className="hover:bg-neutral-50/60 transition-colors group">
                        <td className="py-3.5 px-3 text-center text-neutral-500 font-medium">
                          {item.index}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded bg-white p-0.5 border border-neutral-200 shadow-2xs">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="44px"
                                className="object-contain"
                              />
                            </div>
                            <span className="font-bold text-neutral-900 group-hover:text-red-600 transition-colors">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#D62828] whitespace-nowrap">
                          ₹ {item.rate.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(item.productId, e.target.value)}
                            aria-label={`Quantity for ${item.name}`}
                            className="w-16 h-8 text-center border border-neutral-300 rounded text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#D62828] whitespace-nowrap">
                          ₹ {item.lineAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-neutral-400 hover:text-[#D62828] p-1.5 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Product Cards (sm:hidden) */}
              <div className="sm:hidden divide-y divide-neutral-100 mt-2 space-y-1">
                {cartProductList.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                      <div className="relative w-12 h-12 shrink-0 rounded bg-white p-0.5 border border-neutral-200 shadow-2xs">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-neutral-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs font-bold text-[#D62828] mt-0.5">
                          ₹ {item.rate.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="flex flex-col items-end space-y-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={item.quantity}
                          onChange={(e) => handleQuantityInput(item.productId, e.target.value)}
                          aria-label={`Quantity for ${item.name}`}
                          className="w-14 h-8 text-center border border-neutral-300 rounded text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
                        />
                        <span className="text-xs font-bold text-[#D62828]">
                          ₹ {item.lineAmount.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-neutral-400 hover:text-[#D62828] p-1.5 transition-colors focus:outline-none"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary Panel */}
              <div className="mt-5 sm:mt-6 bg-[#FFF8F0] border border-[#FDE3D2] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-center justify-around sm:justify-start sm:space-x-16">
                {/* Total Quantity */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="text-[#D62828]">
                    <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <span className="block text-[11px] sm:text-xs text-neutral-500 font-medium">
                      Total Quantity
                    </span>
                    <span className="block text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
                      {totalQuantity}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-10 w-px bg-[#FCD7BF]" />

                {/* Total Amount */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="text-[#D62828]">
                    <Coins className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <span className="block text-[11px] sm:text-xs text-neutral-500 font-medium">
                      Total Amount
                    </span>
                    <span className="block text-xl sm:text-2xl font-bold text-[#D62828] leading-tight">
                      ₹ {calculatedTotalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================== */}
            {/* SECTION 2: CUSTOMER DETAILS FORM                           */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6 lg:p-7">
              {/* Heading */}
              <div className="flex items-center space-x-2.5 pb-2">
                <User className="w-5 h-5 text-neutral-900 shrink-0" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    Customer Details
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 ml-7.5 mb-6">
                Please enter your details to place the order.
              </p>

              {/* Submission Error Banner */}
              {submissionError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{submissionError}</div>
                </div>
              )}

              {/* Details Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold text-neutral-700 mb-1.5"
                    >
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        {...register("fullName")}
                        className="w-full pl-10 pr-3.5 h-11 rounded-lg border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors bg-white"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label
                      htmlFor="mobileNumber"
                      className="block text-xs font-semibold text-neutral-700 mb-1.5"
                    >
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="mobileNumber"
                        type="tel"
                        maxLength={10}
                        placeholder="Enter your mobile number"
                        {...register("mobileNumber")}
                        className="w-full pl-10 pr-3.5 h-11 rounded-lg border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors bg-white"
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {errors.mobileNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label
                    htmlFor="deliveryAddress"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Delivery Address <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <textarea
                      id="deliveryAddress"
                      rows={3}
                      placeholder="Enter your complete address"
                      {...register("deliveryAddress")}
                      className="w-full pl-10 pr-3.5 pt-3 pb-3 rounded-lg border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors bg-white resize-none"
                    />
                  </div>
                  {errors.deliveryAddress && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {errors.deliveryAddress.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {/* City / Town */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-xs font-semibold text-neutral-700 mb-1.5"
                    >
                      City / Town <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="city"
                        type="text"
                        placeholder="Enter city / town"
                        {...register("city")}
                        className="w-full pl-10 pr-3.5 h-11 rounded-lg border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors bg-white"
                      />
                    </div>
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label
                      htmlFor="pincode"
                      className="block text-xs font-semibold text-neutral-700 mb-1.5"
                    >
                      Pincode <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="pincode"
                        type="text"
                        maxLength={6}
                        placeholder="Enter pincode"
                        {...register("pincode")}
                        className="w-full pl-10 pr-3.5 h-11 rounded-lg border border-neutral-300 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors bg-white"
                      />
                    </div>
                    {errors.pincode && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Notes (Optional) */}
                <div className="bg-[#FFF8F0] border border-[#FDE3D2] rounded-xl p-3.5 sm:p-4">
                  <label
                    htmlFor="orderNotes"
                    className="block text-xs font-bold text-[#D62828] mb-2"
                  >
                    Order Notes (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3 pointer-events-none" />
                    <textarea
                      id="orderNotes"
                      rows={2}
                      placeholder="Any special instructions for your order?"
                      {...register("orderNotes")}
                      className="w-full pl-10 pr-3.5 pt-2.5 pb-2.5 rounded-md border border-neutral-300 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors resize-none"
                    />
                  </div>
                  {errors.orderNotes && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium">
                      {errors.orderNotes.message}
                    </p>
                  )}
                </div>

                {/* Place Order CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || cartProductList.length === 0}
                    className="w-full bg-[#D62828] hover:bg-[#B71C1C] text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <span>Place Order &rarr;</span>
                    )}
                  </button>
                </div>

                {/* Informational Message */}
                <div className="pt-1 flex items-center justify-center space-x-1.5 text-center px-2">
                  <ShieldAlert className="w-4 h-4 text-[#EA580C] shrink-0" />
                  <p className="text-[11px] sm:text-xs text-neutral-600 font-medium">
                    Your order details will be shared with the owner for confirmation. Transportation charges are to be handled by the customer.
                  </p>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
