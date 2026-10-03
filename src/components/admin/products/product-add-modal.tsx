"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X,
  Image as ImageIcon,
  Upload,
  Trash2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { AdminCategory, CreateProductInput } from "@/types/admin-product";

interface ProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: CreateProductInput, imageFile?: File) => Promise<boolean>;
  categories: AdminCategory[];
}

export function ProductAddModal({
  isOpen,
  onClose,
  onAdd,
  categories,
}: ProductAddModalProps) {
  // Form State
  const [name, setName] = useState("");
  const [tamilName, setTamilName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [marketRate, setMarketRate] = useState<string>("");
  const [sellingRate, setSellingRate] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 819200) {
      setErrors((prev) => ({
        ...prev,
        image: `File size exceeds 800 KB limit (${(file.size / 1024).toFixed(1)} KB).`,
      }));
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Allowed formats are PNG, JPEG, and WebP.',
      }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleValidate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Product name is required";
    if (!categoryId) errs.categoryId = "Category is required";
    if (!sellingRate.trim() || isNaN(Number(sellingRate)) || Number(sellingRate) <= 0) {
      errs.sellingRate = "Valid selling rate is required (greater than 0)";
    }
    if (marketRate.trim() && (isNaN(Number(marketRate)) || Number(marketRate) < 0)) {
      errs.marketRate = "Market rate must be a non-negative number";
    }
    if (stock.trim() && (isNaN(Number(stock)) || Number(stock) < 0)) {
      errs.stock = "Stock must be a non-negative number";
    }
    if (lowStockThreshold.trim() && (isNaN(Number(lowStockThreshold)) || Number(lowStockThreshold) < 0)) {
      errs.lowStockThreshold = "Low stock threshold must be a non-negative number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidate() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);

    const input: CreateProductInput = {
      name: name.trim(),
      tamil_name: tamilName.trim() || null,
      category_id: categoryId,
      market_rate: marketRate.trim() ? Number(marketRate) : null,
      selling_rate: Number(sellingRate),
      stock: stock.trim() ? Number(stock) : null,
      low_stock_threshold: lowStockThreshold.trim() ? Number(lowStockThreshold) : null,
      description: description.trim() || null,
      image_url: null,
      is_available: isAvailable,
    };

    const success = await onAdd(input, selectedImageFile ?? undefined);
    setIsSubmitting(false);

    if (success) {
      // Reset form
      setName("");
      setTamilName("");
      setCategoryId("");
      setMarketRate("");
      setSellingRate("");
      setStock("");
      setLowStockThreshold("");
      setDescription("");
      handleRemoveImage();
      onClose();
    } else {
      setServerError("Failed to create product. Please check the inputs.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full sm:max-w-3xl lg:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              Add New Product
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fill in the required product details to add a new item to the catalogue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            aria-label="Close add product modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Image & Status */}
            <div className="md:col-span-5 space-y-5">
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                    <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                    <span>Product Image</span>
                  </div>

                  {imagePreviewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full aspect-square bg-white rounded-lg border border-neutral-200 overflow-hidden flex items-center justify-center p-3 relative shadow-inner">
                  {imagePreviewUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreviewUrl}
                        alt="Product preview"
                        fill
                        sizes="250px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-neutral-400 space-y-1">
                      <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-xs">No image chosen</p>
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2 px-3 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-white bg-white/70 shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{imagePreviewUrl ? "Change Image" : "Choose Image"}</span>
                </button>

                {errors.image && (
                  <p className="text-[10px] text-red-500">{errors.image}</p>
                )}

                <p className="text-[11px] text-neutral-400 leading-tight">
                  Recommended: 800 × 800 px. Max 800 KB (PNG, JPEG, WebP).
                </p>
              </div>

              {/* Status */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                  <span>Product Status</span>
                </div>

                <div className="relative">
                  <select
                    value={isAvailable ? "available" : "unavailable"}
                    onChange={(e) => setIsAvailable(e.target.value === "available")}
                    className="w-full appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-800 shadow-2xs focus:outline-none focus:border-[#0D7A4D] cursor-pointer"
                  >
                    <option value="available">In Stock (Available)</option>
                    <option value="unavailable">Out of Stock (Unavailable)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right Column: Fields */}
            <div className="md:col-span-7 space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                  <span>Basic Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='e.g. 4" Gold Lakshmi'
                      className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-neutral-200 focus:border-[#0D7A4D] focus:ring-[#0D7A4D]"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[10px] text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Tamil Name
                    </label>
                    <input
                      type="text"
                      value={tamilName}
                      onChange={(e) => setTamilName(e.target.value)}
                      placeholder='e.g. 4" கோல்ட் லட்சுமி'
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D7A4D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={`w-full appearance-none bg-white border rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-neutral-800 focus:outline-none ${
                          errors.categoryId
                            ? "border-red-500"
                            : "border-neutral-200 focus:border-[#0D7A4D]"
                        }`}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.categoryId && (
                      <p className="text-[10px] text-red-500">{errors.categoryId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                  <span>Pricing</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Market Rate (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={marketRate}
                      onChange={(e) => setMarketRate(e.target.value)}
                      placeholder="40.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D7A4D]"
                    />
                    {errors.marketRate && (
                      <p className="text-[10px] text-red-500">{errors.marketRate}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Our Rate (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingRate}
                      onChange={(e) => setSellingRate(e.target.value)}
                      placeholder="35.00"
                      className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                        errors.sellingRate
                          ? "border-red-500"
                          : "border-neutral-200 focus:border-[#0D7A4D]"
                      }`}
                    />
                    {errors.sellingRate && (
                      <p className="text-[10px] text-red-500">{errors.sellingRate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                  <span>Stock Information</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="250"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D7A4D]"
                    />
                    {errors.stock && (
                      <p className="text-[10px] text-red-500">{errors.stock}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D7A4D]"
                    />
                    {errors.lowStockThreshold && (
                      <p className="text-[10px] text-red-500">{errors.lowStockThreshold}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
                  <span>Description</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description and specifications..."
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D7A4D] resize-none"
                  />
                  <span className="absolute right-2.5 bottom-2 text-[10px] text-neutral-400">
                    {description.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Adding..." : "Add Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
