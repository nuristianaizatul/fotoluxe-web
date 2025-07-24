import Category from "../models/CategoryModel.js";

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data kategori" });
  }
};

// Create category
export const createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    await Category.create({ name });
    res.status(201).json({ msg: "Kategori berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menambahkan kategori" });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ msg: "Kategori tidak ditemukan" });

    await category.update({ name });
    res.json({ msg: "Kategori berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal memperbarui kategori" });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ msg: "Kategori tidak ditemukan" });

    await category.destroy();
    res.json({ msg: "Kategori berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus kategori" });
  }
};
