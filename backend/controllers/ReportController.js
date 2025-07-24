// controllers/ReportControllers.js
import Report from '../models/ReportModel.js';
import Users from '../models/UserModel.js';

// Ambil semua laporan untuk admin
export const getReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: Users, as: 'Reporter', attributes: ['name'] },
        { model: Users, as: 'ReportedUser', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const result = reports.map((r) => ({
      id: r.id,
      reporterName: r.Reporter.name,
      reportedName: r.ReportedUser.name,
      reason: r.reason,
      createdAt: r.createdAt
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil laporan' });
  }
};

// Hapus laporan tertentu
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ msg: 'Laporan tidak ditemukan' });

    await report.destroy();
    res.json({ msg: 'Laporan berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal menghapus laporan' });
  }
};
