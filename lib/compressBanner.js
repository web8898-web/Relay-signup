export async function compressBanner(file) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("無法讀取這張圖片"));
      image.src = objectUrl;
    });

    const targetWidth = 1200;
    const targetHeight = 630;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法處理圖片");

    const scale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (targetWidth - width) / 2, (targetHeight - height) / 2, width, height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("圖片壓縮失敗"))),
        "image/webp",
        0.82
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

