export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const res = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!res.ok) throw new Error("Could not prepare secure upload.");
  return res.json();
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadCandidatePhoto(file: File): Promise<UploadResult> {
  const sig = await getCloudinarySignature();
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Image upload failed. Please try again.");
  }
  const data = await res.json();
  return { url: data.secure_url as string, publicId: data.public_id as string };
}
