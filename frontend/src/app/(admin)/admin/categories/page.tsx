"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  getPublicCategoryTreeApi,
  adminCreateCategoryApi,
  adminUpdateCategoryApi,
  adminDeleteCategoryApi,
} from "@/services/product-service";
import { CategoryTree, CreateCategoryPayload, UpdateCategoryPayload } from "@/types/product";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [flatCategories, setFlatCategories] = useState<{ id: string; name: string; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CategoryTree | null>(null);
  const [deleteNode, setDeleteNode] = useState<CategoryTree | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getPublicCategoryTreeApi();
      if (res.success && res.data) {
        setCategories(res.data);
        const flattened: { id: string; name: string; level: number }[] = [];
        const flatten = (nodes: CategoryTree[], lvl = 0) => {
          nodes.forEach((n) => {
            flattened.push({ id: n.id, name: n.name, level: lvl });
            if (n.children && n.children.length > 0) {
              flatten(n.children, lvl + 1);
            }
          });
        };
        flatten(res.data);
        setFlatCategories(flattened);
      }
    } catch (err) {
      console.error("Failed to load category tree", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = (parent?: CategoryTree) => {
    setEditingNode(null);
    setName("");
    setDescription("");
    setParentId(parent ? parent.id : "");
    setDisplayOrder("0");
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (node: CategoryTree) => {
    setEditingNode(node);
    setName(node.name);
    setDescription(node.description || "");
    setParentId("");
    setDisplayOrder((node.displayOrder ?? 0).toString());
    setIsActive(node.active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("alight_token") || "";
      if (editingNode) {
        const payload: UpdateCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId || undefined,
          displayOrder: parseInt(displayOrder) || 0,
          active: isActive,
        };
        const res = await adminUpdateCategoryApi(editingNode.id, payload, token);
        if (res.success) {
          setModalOpen(false);
          fetchCategories();
        } else {
          setFormError(res.message || "Failed to update category");
        }
      } else {
        const payload: CreateCategoryPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId || undefined,
          displayOrder: parseInt(displayOrder) || 0,
          active: true,
        };
        const res = await adminCreateCategoryApi(payload, token);
        if (res.success) {
          setModalOpen(false);
          fetchCategories();
        } else {
          setFormError(res.message || "Failed to create category");
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteNode) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminDeleteCategoryApi(deleteNode.id, token);
      if (res.success) {
        setDeleteNode(null);
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryRows = (nodes: CategoryTree[], level = 0): React.ReactNode => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <tr className="hover:bg-brand-slate-50/60 transition-colors">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {level > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-slate-400 shrink-0" />}
              <div className="w-6 h-6 rounded bg-brand-slate-100 flex items-center justify-center shrink-0 text-brand-slate-600">
                <FolderTree className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-brand-slate-900">{node.name}</span>
                <span className="ml-2 font-mono text-[10px] text-brand-slate-400">/{node.slug}</span>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-brand-slate-500">
            {node.description || <span className="italic text-brand-slate-300">None</span>}
          </td>
          <td className="px-4 py-3 font-semibold text-brand-slate-700">
            {node.displayOrder ?? 0}
          </td>
          <td className="px-4 py-3">
            {node.active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="neutral">Disabled</Badge>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreateModal(node)}
                title="Add Subcategory"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Sub
              </Button>
              <button
                onClick={() => openEditModal(node)}
                className="p-1.5 text-brand-slate-600 hover:bg-brand-slate-100 rounded-lg transition-colors"
                title="Edit Category"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteNode(node)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
        {node.children && node.children.length > 0 && renderCategoryRows(node.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Taxonomy & Category Tree</h1>
          <p className="text-xs text-brand-slate-500">
            Organize catalog classifications, hierarchical parent-child trees, and storefront navigation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Root Category
          </Button>
        </div>
      </div>

      {/* Category Tree Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Category Hierarchy</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading category taxonomy...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-400">
                    <FolderTree className="w-8 h-8 mx-auto text-brand-slate-300 mb-2" />
                    <p className="font-semibold text-brand-slate-700">No categories found</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      Click &apos;Add Root Category&apos; to start defining your product tree.
                    </p>
                  </td>
                </tr>
              ) : (
                renderCategoryRows(categories)
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create / Edit Category */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNode ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Architectural Lighting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Parent Category
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            >
              <option value="">None (Top-Level Root Category)</option>
              {flatCategories
                .filter((c) => !editingNode || c.id !== editingNode.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {"- ".repeat(c.level) + c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-brand-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Summary for SEO and navigational context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-brand-slate-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
            </div>

            {editingNode && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="catActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-brand-burgundy focus:ring-brand-burgundy"
                />
                <label htmlFor="catActiveCheck" className="font-semibold text-brand-slate-700">
                  Active in Storefront
                </label>
              </div>
            )}
          </div>

          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingNode ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Category */}
      <Modal
        isOpen={!!deleteNode}
        onClose={() => setDeleteNode(null)}
        title="Delete Category"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to delete <span className="font-bold text-brand-slate-900">{deleteNode?.name}</span>?
          </p>
          <p className="text-xs text-brand-slate-500">
            Categories containing subcategories or linked products cannot be deleted.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeleteNode(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
