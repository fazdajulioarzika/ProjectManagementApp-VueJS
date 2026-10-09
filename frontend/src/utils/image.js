// Potong persegi dari tengah, kecilkan, ubah jadi data URL JPEG
export function resizeImage(file, size = 160, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#fff"; // latar putih untuk PNG transparan
      ctx.fillRect(0, 0, size, size);

      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File gambar tidak valid"));
    };

    img.src = url;
  });
}
