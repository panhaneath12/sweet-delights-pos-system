import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, ArrowLeft, Search, CheckCircle, XCircle, X } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import {
  getProducts,
  setProducts,
  getCategories,
  setCategories,
  getCurrentUser,
  getCurrentSession,
} from "../utils/storage";
import type { Product, Category } from "../types";
import {
  fetchProductsFromSupabase,
  fetchCategoriesFromSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  upsertCategoryToSupabase,
  deleteCategoryFromSupabase,
} from "../lib/adminProducts";

// Toast Component
const Toast: React.FC<{
  type: "success" | "error";
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={20} className="text-green-600" />
      ) : (
        <XCircle size={20} className="text-red-600" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-white/50 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();

  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productActive, setProductActive] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);

  const [syncError, setSyncError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!currentUser || !currentSession) navigate("/");
  }, [currentUser, currentSession, navigate]);

  if (!currentUser || !currentSession) return null;

  if (currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            Access Denied. Admin privileges required.
          </p>
          <Button onClick={() => navigate("/pos")}>Back to POS</Button>
        </div>
      </div>
    );
  }

  // Show toast notification
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ load remote -> overwrite local (only when online)
  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) {
        showToast("error", "Offline mode - using local data");
        return;
      }
      try {
        setSyncError(null);
        const [cats, prods] = await Promise.all([
          fetchCategoriesFromSupabase(),
          fetchProductsFromSupabase(),
        ]);
        setCategories(cats);
        setProducts(prods);
        showToast("success", "Data loaded from cloud successfully");
      } catch (e: any) {
        console.error("❌ admin products load failed:", e);
        setSyncError("Could not load from cloud. Using local data.");
        showToast("error", "Failed to load from cloud - using local data");
      }
    };
    load();
  }, []);

  const products = getProducts();
  const categories = getCategories();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, filterCategory]);

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductPrice(product.basePrice.toString());
      setProductCategory(product.categoryId);
      setProductActive(product.active);
    } else {
      setEditingProduct(null);
      setProductName("");
      setProductPrice("");
      setProductCategory(categories[0]?.id || "");
      setProductActive(true);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    const price = parseFloat(productPrice);
    if (!productName.trim() || isNaN(price) || !productCategory) {
      showToast("error", "Please fill all required fields");
      return;
    }

    const allProducts = getProducts();

    const savedProduct: Product = editingProduct
      ? {
          ...editingProduct,
          name: productName.trim(),
          basePrice: price,
          categoryId: productCategory,
          active: productActive,
        }
      : {
          id: crypto.randomUUID(),
          name: productName.trim(),
          basePrice: price,
          categoryId: productCategory,
          active: productActive,
        };

    const updated = editingProduct
      ? allProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      : [...allProducts, savedProduct];

    // Local first
    setProducts(updated);
    setProductModalOpen(false);
    
    const action = editingProduct ? "updated" : "created";
    showToast("success", `Product ${action} locally`);

    // Sync to cloud
    try {
      if (navigator.onLine) {
        await upsertProductToSupabase(savedProduct);
        showToast("success", `Product ${action} and synced to cloud ✓`);
        setSyncError(null);
      } else {
        showToast("error", `Product ${action} locally only (offline)`);
        setSyncError(`Product ${action} locally, but not synced (offline).`);
      }
    } catch (e) {
      console.error("❌ product sync failed:", e);
      showToast("error", `Product ${action} locally but cloud sync failed`);
      setSyncError(`Product ${action} locally, but cloud sync failed.`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    // Local first
    const allProducts = getProducts();
    setProducts(allProducts.filter((p) => p.id !== productId));
    showToast("success", "Product deleted locally");

    // Sync to cloud
    try {
      if (navigator.onLine) {
        await deleteProductFromSupabase(productId);
        showToast("success", "Product deleted and synced to cloud ✓");
        setSyncError(null);
      } else {
        showToast("error", "Product deleted locally only (offline)");
        setSyncError("Product deleted locally, but not synced (offline).");
      }
    } catch (e) {
      console.error("❌ product delete sync failed:", e);
      showToast("error", "Product deleted locally but cloud sync failed");
      setSyncError("Product deleted locally, but cloud sync failed.");
    }
  };

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategorySortOrder(category.sortOrder.toString());
      setCategoryActive(category.active);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategorySortOrder((categories.length + 1).toString());
      setCategoryActive(true);
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    const sortOrder = parseInt(categorySortOrder, 10);
    if (!categoryName.trim() || isNaN(sortOrder)) {
      showToast("error", "Please fill all required fields");
      return;
    }

    const allCategories = getCategories();

    const savedCategory: Category = editingCategory
      ? {
          ...editingCategory,
          name: categoryName.trim(),
          sortOrder,
          active: categoryActive,
        }
      : {
          id: crypto.randomUUID(),
          name: categoryName.trim(),
          sortOrder,
          active: categoryActive,
        };

    const updated = editingCategory
      ? allCategories.map((c) => (c.id === savedCategory.id ? savedCategory : c))
      : [...allCategories, savedCategory];

    // Local first
    setCategories(updated);
    setCategoryModalOpen(false);
    
    const action = editingCategory ? "updated" : "created";
    showToast("success", `Category ${action} locally`);

    // Sync to cloud
    try {
      if (navigator.onLine) {
        await upsertCategoryToSupabase(savedCategory);
        showToast("success", `Category ${action} and synced to cloud ✓`);
        setSyncError(null);
      } else {
        showToast("error", `Category ${action} locally only (offline)`);
        setSyncError(`Category ${action} locally, but not synced (offline).`);
      }
    } catch (e) {
      console.error("❌ category sync failed:", e);
      showToast("error", `Category ${action} locally but cloud sync failed`);
      setSyncError(`Category ${action} locally, but cloud sync failed.`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const productsInCategory = products.filter((p) => p.categoryId === categoryId);
    if (productsInCategory.length > 0) {
      showToast("error", "Cannot delete category with products");
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;

    // Local first
    const allCategories = getCategories();
    setCategories(allCategories.filter((c) => c.id !== categoryId));
    showToast("success", "Category deleted locally");

    // Sync to cloud
    try {
      if (navigator.onLine) {
        await deleteCategoryFromSupabase(categoryId);
        showToast("success", "Category deleted and synced to cloud ✓");
        setSyncError(null);
      } else {
        showToast("error", "Category deleted locally only (offline)");
        setSyncError("Category deleted locally, but not synced (offline).");
      }
    } catch (e) {
      console.error("❌ category delete sync failed:", e);
      showToast("error", "Category deleted locally but cloud sync failed");
      setSyncError("Category deleted locally, but cloud sync failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <AppHeader
        shopName="Sweet Delights Bakery"
        cashierName={currentUser.name}
        onSettingsClick={() => navigate("/settings")}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/pos")}>
              <ArrowLeft size={18} />
              Back to POS
            </Button>
            <h2>Product Management</h2>
          </div>
        </div>

        {syncError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm flex items-center justify-between">
            <span>{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="ml-2 p-1 rounded hover:bg-yellow-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 ${
              activeTab === "products"
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-6 py-3 ${
              activeTab === "categories"
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="bg-white rounded-lg p-4 mb-4 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <Button variant="primary" onClick={() => handleOpenProductModal()}>
                <Plus size={18} />
                Add Product
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs text-[var(--color-text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const category = categories.find((c) => c.id === product.categoryId);
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-[var(--color-border)] hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                          {category?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4">${product.basePrice.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge variant={product.active ? "success" : "default"}>
                            {product.active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenProductModal(product)}
                            className="p-2 rounded hover:bg-gray-100 inline-flex items-center justify-center mr-2"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 rounded hover:bg-red-100 text-[var(--color-error)] inline-flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="mb-4 flex justify-end">
              <Button variant="primary" onClick={() => handleOpenCategoryModal()}>
                <Plus size={18} />
                Add Category
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Sort Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs text-[var(--color-text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((category) => {
                      const productCount = products.filter((p) => p.categoryId === category.id)
                        .length;
                      return (
                        <tr
                          key={category.id}
                          className="border-b border-[var(--color-border)] hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">{category.name}</td>
                          <td className="px-6 py-4">{category.sortOrder}</td>
                          <td className="px-6 py-4">{productCount}</td>
                          <td className="px-6 py-4">
                            <StatusBadge variant={category.active ? "success" : "default"}>
                              {category.active ? "Active" : "Inactive"}
                            </StatusBadge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenCategoryModal(category)}
                              className="p-2 rounded hover:bg-gray-100 inline-flex items-center justify-center mr-2"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-2 rounded hover:bg-red-100 text-[var(--color-error)] inline-flex items-center justify-center"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
          />
          <Input
            label="Base Price *"
            type="number"
            step="0.01"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="0.00"
          />
          <div>
            <label className="block mb-2 text-sm">Category *</label>
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories
                .filter((c) => c.active)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="productActive"
              checked={productActive}
              onChange={(e) => setProductActive(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="productActive" className="text-sm cursor-pointer">
              Active (visible in POS)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleSaveProduct}>
              {editingProduct ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
          />
          <Input
            label="Sort Order *"
            type="number"
            value={categorySortOrder}
            onChange={(e) => setCategorySortOrder(e.target.value)}
            placeholder="1"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="categoryActive"
              checked={categoryActive}
              onChange={(e) => setCategoryActive(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="categoryActive" className="text-sm cursor-pointer">
              Active (visible in POS)
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleSaveCategory}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add CSS for toast animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};