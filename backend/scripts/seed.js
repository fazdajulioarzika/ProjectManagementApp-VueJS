/**
 * Seed data demo untuk TaskFlow.
 *
 * Pemakaian (dari folder backend):
 *   npm run seed          -> hapus data demo lama (jika ada), lalu buat ulang
 *   npm run seed:clean    -> hanya hapus data demo
 *   npm run seed -- --yes -> lewati pertanyaan konfirmasi
 *
 * Keamanan untuk database tunggal:
 * - Semua data demo ditandai dengan email berakhiran @example.com.
 * - Script hanya menghapus akun tersebut beserta project, task, komentar,
 *   aktivitas, dan notifikasi miliknya. Data lain tidak disentuh.
 * - Sebelum berjalan, script menampilkan nama database dan meminta konfirmasi.
 *
 * Password akun demo: Demo12345 (ubah lewat variabel SEED_PASSWORD).
 */
import dns from "dns";
import "dotenv/config";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";
import Project from "../src/models/Project.js";
import Task from "../src/models/Task.js";
import Comment from "../src/models/Comment.js";
import Activity from "../src/models/Activity.js";
import Notification from "../src/models/Notification.js";

// Hanya untuk lokal: pakai DNS publik jika DNS jaringan bermasalah
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const DEMO_EMAIL = /@example\.com$/i;
const PASSWORD = process.env.SEED_PASSWORD || "Demo12345";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms);
const inDays = (n) => new Date(Date.now() + n * DAY);

const PEOPLE = {
  andi: { name: "Andi Pratama", role: "manager" },
  rina: { name: "Rina Kartika", role: "manager" },
  budi: { name: "Budi Santoso", role: "member" },
  citra: { name: "Citra Dewi", role: "member" },
  dina: { name: "Dina Lestari", role: "member" },
};

// Format task: [judul, status, priority, assignee, due (hari dari sekarang), deskripsi]
const PROJECTS = [
  {
    name: "HRIS Development",
    description:
      "Sistem informasi SDM untuk mengelola data karyawan, absensi, cuti, dan laporan bulanan.",
    status: "active",
    owner: "andi",
    startDays: -34,
    endDays: 26,
    members: {
      andi: "Project Manager",
      budi: "Backend Developer",
      citra: "UI/UX Designer",
      dina: "Frontend Developer",
    },
    tasks: [
      [
        "Setup repository dan CI/CD",
        "done",
        "medium",
        "budi",
        -26,
        "Menyiapkan repository, branch strategy, dan pipeline otomatis.",
      ],
      [
        "Desain skema database karyawan",
        "done",
        "high",
        "budi",
        -22,
        "Merancang koleksi karyawan, departemen, dan jabatan.",
      ],
      [
        "Desain UI dashboard HR",
        "done",
        "high",
        "citra",
        -19,
        "Mockup dashboard dan komponen utama di Figma.",
      ],
      [
        "Halaman login dan autentikasi",
        "done",
        "high",
        "dina",
        -14,
        "Form login, validasi, dan penyimpanan sesi.",
      ],
      [
        "CRUD data karyawan",
        "done",
        "high",
        "budi",
        -7,
        "Endpoint dan halaman untuk mengelola data karyawan.",
      ],
      [
        "Modul pengajuan cuti",
        "review",
        "high",
        "budi",
        -2,
        "Alur pengajuan dan persetujuan cuti oleh atasan.",
      ],
      [
        "Dashboard UI",
        "in_progress",
        "medium",
        "dina",
        2,
        "Membuat dashboard responsif dengan ringkasan data HR.",
      ],
      [
        "Integrasi API mesin absensi",
        "in_progress",
        "urgent",
        "budi",
        -1,
        "Sinkronisasi data kehadiran dari mesin absensi.",
      ],
      [
        "Halaman profil karyawan",
        "todo",
        "low",
        "citra",
        10,
        "Tampilan detail profil dan riwayat karyawan.",
      ],
      [
        "Laporan bulanan (export PDF)",
        "todo",
        "medium",
        "dina",
        14,
        "Ekspor rekap absensi dan cuti per bulan.",
      ],
      [
        "Pengujian UAT",
        "todo",
        "medium",
        null,
        24,
        "Uji penerimaan bersama tim HR sebelum rilis.",
      ],
      [
        "Dokumentasi pengguna",
        "todo",
        "low",
        null,
        null,
        "Panduan penggunaan untuk admin dan karyawan.",
      ],
    ],
    comments: [
      [
        "Dashboard UI",
        "dina",
        "Layout desktop sudah selesai, tinggal bagian tablet.",
        300,
      ],
      [
        "Dashboard UI",
        "citra",
        "Revisi warna sudah saya upload di Figma ya.",
        180,
      ],
      [
        "Dashboard UI",
        "andi",
        "Bagian mobile masih perlu diperbaiki sebelum review.",
        40,
      ],
      [
        "Integrasi API mesin absensi",
        "budi",
        "Endpoint sinkronisasi sudah jalan, sedang menangani data duplikat.",
        1200,
      ],
      [
        "Integrasi API mesin absensi",
        "andi",
        "Tolong diprioritaskan, ini blocker untuk modul cuti.",
        900,
      ],
      [
        "Modul pengajuan cuti",
        "budi",
        "Siap direview, mohon cek alur persetujuan atasan.",
        2600,
      ],
      [
        "Modul pengajuan cuti",
        "andi",
        "Ada beberapa catatan, nanti saya tulis di pull request.",
        2400,
      ],
    ],
  },
  {
    name: "Website Company Profile",
    description:
      "Pembuatan situs profil perusahaan yang modern, responsif, dan ramah SEO.",
    status: "active",
    owner: "rina",
    startDays: -32,
    endDays: 12,
    members: {
      rina: "Project Manager",
      citra: "UI/UX Designer",
      dina: "Frontend Developer",
    },
    tasks: [
      [
        "Riset kompetitor",
        "done",
        "medium",
        "citra",
        -28,
        "Analisis tampilan dan fitur situs perusahaan sejenis.",
      ],
      [
        "Wireframe halaman utama",
        "done",
        "high",
        "citra",
        -24,
        "Wireframe low-fidelity untuk halaman Home.",
      ],
      [
        "Slicing halaman Home",
        "done",
        "high",
        "dina",
        -16,
        "Implementasi desain Home dengan layout responsif.",
      ],
      [
        "Halaman About dan Team",
        "done",
        "medium",
        "dina",
        -10,
        "Halaman profil perusahaan dan daftar tim.",
      ],
      [
        "Halaman Blog",
        "done",
        "medium",
        "dina",
        -6,
        "Daftar artikel dan halaman detail artikel.",
      ],
      [
        "Optimasi SEO dasar",
        "review",
        "medium",
        "dina",
        1,
        "Meta tag, sitemap, dan struktur heading.",
      ],
      [
        "Form kontak dan integrasi email",
        "in_progress",
        "high",
        "dina",
        3,
        "Form kontak dengan validasi dan pengiriman email.",
      ],
      [
        "Uji responsif di perangkat mobile",
        "todo",
        "high",
        "citra",
        5,
        "Pengecekan tampilan di berbagai ukuran layar.",
      ],
      [
        "Deploy ke production",
        "todo",
        "urgent",
        "rina",
        8,
        "Konfigurasi domain, SSL, dan rilis versi pertama.",
      ],
    ],
    comments: [
      [
        "Form kontak dan integrasi email",
        "dina",
        "Validasi form sudah selesai, tinggal menyambungkan ke layanan email.",
        600,
      ],
      [
        "Form kontak dan integrasi email",
        "rina",
        "Pastikan ada proteksi spam sederhana ya.",
        420,
      ],
      [
        "Optimasi SEO dasar",
        "dina",
        "Meta tag dan sitemap sudah ditambahkan.",
        1500,
      ],
    ],
  },
  {
    name: "Mobile App",
    description:
      "Aplikasi mobile pendamping untuk pelanggan, saat ini dalam tahap perencanaan.",
    status: "planning",
    owner: "andi",
    startDays: -6,
    endDays: 60,
    members: {
      andi: "Project Manager",
      rina: "Product Owner",
      budi: "Backend Developer",
    },
    tasks: [
      [
        "Definisi fitur MVP",
        "done",
        "high",
        "rina",
        -3,
        "Menentukan fitur inti yang masuk rilis pertama.",
      ],
      [
        "Riset teknologi (Flutter vs React Native)",
        "in_progress",
        "medium",
        "budi",
        3,
        "Membandingkan performa dan ekosistem kedua framework.",
      ],
      [
        "Wireframe aplikasi",
        "todo",
        "medium",
        "rina",
        7,
        "Alur layar utama dan navigasi aplikasi.",
      ],
      [
        "Rancang API untuk mobile",
        "todo",
        "high",
        "budi",
        12,
        "Menentukan endpoint dan format respons.",
      ],
      [
        "Estimasi anggaran dan jadwal",
        "todo",
        "low",
        "andi",
        6,
        "Perkiraan biaya, tenaga, dan timeline.",
      ],
    ],
    comments: [
      [
        "Riset teknologi (Flutter vs React Native)",
        "budi",
        "Prototipe kecil dengan Flutter sudah jalan, performanya bagus.",
        200,
      ],
      [
        "Riset teknologi (Flutter vs React Native)",
        "rina",
        "Kita bandingkan juga ekosistem library-nya.",
        120,
      ],
    ],
  },
  {
    name: "Company Landing Redesign",
    description:
      "Redesain halaman landing perusahaan. Proyek sudah selesai dan dirilis.",
    status: "completed",
    owner: "rina",
    startDays: -90,
    endDays: -20,
    members: {
      rina: "Project Manager",
      citra: "UI/UX Designer",
      dina: "Frontend Developer",
    },
    tasks: [
      [
        "Audit tampilan lama",
        "done",
        "medium",
        "citra",
        -80,
        "Mengidentifikasi masalah UX pada situs lama.",
      ],
      [
        "Desain halaman baru",
        "done",
        "high",
        "citra",
        -66,
        "Desain final halaman landing di Figma.",
      ],
      [
        "Implementasi frontend",
        "done",
        "high",
        "dina",
        -45,
        "Mengubah desain menjadi halaman responsif.",
      ],
      [
        "Peluncuran dan monitoring",
        "done",
        "medium",
        "rina",
        -22,
        "Rilis ke production dan pemantauan awal.",
      ],
    ],
    comments: [],
  },
];

async function confirm(message) {
  if (process.argv.includes("--yes")) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(`${message} (ketik "ya" untuk lanjut): `);
  rl.close();
  return answer.trim().toLowerCase() === "ya";
}

async function cleanDemoData() {
  const userIds = await User.distinct("_id", { email: DEMO_EMAIL });
  const projectIds = await Project.distinct("_id", { owner: { $in: userIds } });
  const taskIds = await Task.distinct("_id", { project: { $in: projectIds } });

  await Comment.deleteMany({
    $or: [{ task: { $in: taskIds } }, { user: { $in: userIds } }],
  });
  await Activity.deleteMany({
    $or: [{ project: { $in: projectIds } }, { user: { $in: userIds } }],
  });
  await Notification.deleteMany({
    $or: [{ user: { $in: userIds } }, { project: { $in: projectIds } }],
  });
  await Task.deleteMany({ _id: { $in: taskIds } });
  await Project.deleteMany({ _id: { $in: projectIds } });

  // Jika akun demo pernah ditambahkan ke project asli, lepaskan agar tidak ada referensi menggantung
  await Project.updateMany(
    { "members.user": { $in: userIds } },
    { $pull: { members: { user: { $in: userIds } } } }
  );
  await Task.updateMany({ assignee: { $in: userIds } }, { assignee: null });

  await User.deleteMany({ _id: { $in: userIds } });

  console.log(
    `Data demo lama dibersihkan (${userIds.length} akun, ${projectIds.length} project, ${taskIds.length} task).`
  );
}

async function seed() {
  const users = {};
  for (const [key, p] of Object.entries(PEOPLE)) {
    users[key] = await User.create({
      name: p.name,
      email: `${key}@example.com`,
      password: PASSWORD, // di-hash otomatis oleh hook model
      role: p.role,
      createdAt: ago(60 * DAY),
    });
  }

  const activities = [];
  const comments = [];
  const notifications = [];
  let projectCount = 0;
  let taskCount = 0;
  let touch = 0;

  for (const spec of PROJECTS) {
    const owner = users[spec.owner];
    const start = inDays(spec.startDays);

    const project = await Project.create({
      name: spec.name,
      description: spec.description,
      status: spec.status,
      startDate: start,
      endDate: inDays(spec.endDays),
      owner: owner._id,
      members: Object.entries(spec.members).map(([key, title]) => ({
        user: users[key]._id,
        title,
      })),
      createdAt: start,
    });
    projectCount++;

    activities.push({
      project: project._id,
      user: owner._id,
      action: "project.created",
      target: spec.name,
      createdAt: start,
    });
    Object.keys(spec.members)
      .filter((key) => key !== spec.owner)
      .forEach((key, i) => {
        activities.push({
          project: project._id,
          user: owner._id,
          action: "member.added",
          target: users[key].name,
          createdAt: new Date(start.getTime() + (i + 1) * MIN),
        });
      });

    const taskByTitle = {};

    for (const [i, t] of spec.tasks.entries()) {
      const [title, status, priority, assigneeKey, dueDays, description] = t;
      const assignee = assigneeKey ? users[assigneeKey] : null;
      const dueDate = dueDays === null ? null : inDays(dueDays);

      const createdAt = new Date(
        Math.min(start.getTime() + (1 + i * 0.5) * DAY, Date.now() - 2 * HOUR)
      );

      // Task selesai: dianggap rampung sehari sebelum due. Task aktif: baru saja disentuh.
      let updatedAt = createdAt;
      if (status === "done") {
        const finished = (dueDate ?? createdAt).getTime() - DAY;
        updatedAt = new Date(
          Math.max(
            createdAt.getTime(),
            Math.min(finished, Date.now() - 3 * HOUR)
          )
        );
      } else if (status !== "todo") {
        updatedAt = new Date(
          Math.max(createdAt.getTime(), Date.now() - (2 + touch++ * 5) * HOUR)
        );
      }

      const task = await Task.create({
        project: project._id,
        title,
        description,
        status,
        priority,
        assignee: assignee ? assignee._id : null,
        dueDate,
        createdBy: owner._id,
        createdAt,
      });
      // updatedAt diatur langsung agar urutan "Recent Tasks" terlihat natural
      await Task.collection.updateOne(
        { _id: task._id },
        { $set: { updatedAt } }
      );
      taskByTitle[title] = task;
      taskCount++;

      activities.push({
        project: project._id,
        user: owner._id,
        action: "task.created",
        target: title,
        createdAt,
      });
      if (assignee) {
        activities.push({
          project: project._id,
          user: owner._id,
          action: "task.assigned",
          target: title,
          metadata: { assignee: assignee.name },
          createdAt: new Date(createdAt.getTime() + MIN),
        });
      }

      const actor = assignee ?? owner;
      if (status === "done") {
        activities.push({
          project: project._id,
          user: actor._id,
          action: "task.completed",
          target: title,
          metadata: { from: "review", to: "done" },
          createdAt: updatedAt,
        });
      } else if (status === "in_progress" || status === "review") {
        activities.push({
          project: project._id,
          user: actor._id,
          action: "task.moved",
          target: title,
          metadata: {
            from: status === "review" ? "in_progress" : "todo",
            to: status,
          },
          createdAt: updatedAt,
        });
      }

      // Notifikasi penugasan untuk assignee (selain pembuat task)
      if (assignee && assigneeKey !== spec.owner) {
        notifications.push({
          user: assignee._id,
          type: "task.assigned",
          message: `Anda ditugaskan pada task "${title}"`,
          project: project._id,
          task: task._id,
          read: status === "done",
          createdAt: new Date(createdAt.getTime() + MIN),
        });
      }
    }

    for (const [title, userKey, content, minutes] of spec.comments) {
      const task = taskByTitle[title];
      if (!task)
        throw new Error(`Task untuk komentar tidak ditemukan: ${title}`);
      const createdAt = ago(minutes * MIN);

      comments.push({
        task: task._id,
        user: users[userKey]._id,
        content,
        createdAt,
      });
      activities.push({
        project: project._id,
        user: users[userKey]._id,
        action: "comment.added",
        target: title,
        createdAt,
      });
    }
  }

  const createdComments = await Comment.create(comments);
  // Samakan updatedAt dengan createdAt supaya tidak muncul label "diedit"
  await Promise.all(
    createdComments.map((c) =>
      Comment.collection.updateOne(
        { _id: c._id },
        { $set: { updatedAt: c.createdAt } }
      )
    )
  );
  await Activity.create(activities);
  await Notification.create(notifications);

  console.log("\nSeed selesai.");
  console.log(
    `  ${
      Object.keys(users).length
    } akun, ${projectCount} project, ${taskCount} task, ` +
      `${comments.length} komentar, ${activities.length} aktivitas, ${notifications.length} notifikasi\n`
  );
  console.table(
    Object.entries(PEOPLE).map(([key, p]) => ({
      Nama: p.name,
      Role: p.role,
      Email: `${key}@example.com`,
      Password: PASSWORD,
    }))
  );
}

async function main() {
  const cleanOnly = process.argv.includes("--clean");

  await connectDB();
  const existing = await User.countDocuments({ email: DEMO_EMAIL });

  console.log(`Database       : ${mongoose.connection.name}`);
  console.log(`Akun demo ada  : ${existing}`);
  console.log(
    cleanOnly
      ? "Aksi           : HAPUS data demo (akun @example.com beserta datanya)."
      : "Aksi           : hapus data demo lama (jika ada), lalu buat data demo baru."
  );
  console.log("Data lain di database ini tidak disentuh.\n");

  if (!(await confirm("Lanjutkan?"))) {
    console.log("Dibatalkan.");
    await mongoose.disconnect();
    return;
  }

  await cleanDemoData();
  if (!cleanOnly) await seed();

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed gagal:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
